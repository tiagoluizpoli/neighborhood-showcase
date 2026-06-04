import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { condominium } from '@neighborhood-showcase/db/schema/showcase';
import { sql } from 'drizzle-orm';
import { DrizzleCondominiumRepository } from '../../../infrastructure/db/condominium-repository';
import { ListNearbyCondominiums } from './list-nearby-condominiums';

describe('List Nearby Condominiums Integration Test', () => {
  const condoRepo = new DrizzleCondominiumRepository();
  const useCase = new ListNearbyCondominiums(condoRepo);

  const testUserId = 'nearby-creator-id';
  const condoCloseId = 'condo-close-id'; // ~50m away
  const condoMidId = 'condo-mid-id'; // ~500m away
  const condoFarId = 'condo-far-id'; // ~5km away

  // Target coords: Latitude -27.5969, Longitude -48.5495 (Florianópolis Center)
  const targetLat = -27.5969;
  const targetLng = -48.5495;

  beforeAll(async () => {
    await db.delete(condominium);
    await db.delete(user);

    // Create user
    await db.insert(user).values({
      id: testUserId,
      name: 'Nearby Creator',
      email: 'nearby@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // 1. Close Condo (~50m away) - coordinates: Latitude -27.5965, Longitude -48.5495
    await db.insert(condominium).values({
      id: condoCloseId,
      name: 'Condomínio Próximo',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000001',
      createdBy: testUserId,
      status: 'APPROVED',
      latitude: '-27.5965',
      longitude: '-48.5495',
      geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5965), 4326)::geography`,
    });

    // 2. Mid Condo (~500m away) - coordinates: Latitude -27.5925, Longitude -48.5495
    await db.insert(condominium).values({
      id: condoMidId,
      name: 'Condomínio Médio',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000002',
      createdBy: testUserId,
      status: 'APPROVED',
      latitude: '-27.5925',
      longitude: '-48.5495',
      geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5925), 4326)::geography`,
    });

    // 3. Far Condo (~5km away) - coordinates: Latitude -27.5500, Longitude -48.5495
    await db.insert(condominium).values({
      id: condoFarId,
      name: 'Condomínio Distante',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000003',
      createdBy: testUserId,
      status: 'APPROVED',
      latitude: '-27.5500',
      longitude: '-48.5495',
      geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5500), 4326)::geography`,
    });
  });

  afterAll(async () => {
    await db.delete(condominium);
    await db.delete(user);
  });

  test('findNearbyApproved returns condominiums sorted by proximity within radius', async () => {
    // 1. Search with 100m radius -> should only return the Close Condo
    const resultsClose = await useCase.execute({
      latitude: targetLat,
      longitude: targetLng,
      radiusInMeters: 100,
    });
    expect(resultsClose.length).toBe(1);
    const close = resultsClose[0];
    expect(close).toBeDefined();
    if (!close) throw new Error('Expected a nearby condominium');
    expect(close.condo.id).toBe(condoCloseId);
    expect(close.distance).toBeLessThan(100);

    // 2. Search with 1000m (1km) radius -> should return Close and Mid Condos, sorted by distance
    const resultsMid = await useCase.execute({
      latitude: targetLat,
      longitude: targetLng,
      radiusInMeters: 1000,
    });
    expect(resultsMid.length).toBe(2);
    const midClose = resultsMid[0];
    const midFar = resultsMid[1];
    expect(midClose).toBeDefined();
    expect(midFar).toBeDefined();
    if (!midClose || !midFar)
      throw new Error('Expected two nearby condominiums');
    expect(midClose.condo.id).toBe(condoCloseId);
    expect(midFar.condo.id).toBe(condoMidId);
    expect(midClose.distance).toBeLessThan(midFar.distance);

    // 3. Search with 10000m (10km) radius -> should return all three Condos, sorted by distance
    const resultsAll = await useCase.execute({
      latitude: targetLat,
      longitude: targetLng,
      radiusInMeters: 10000,
    });
    expect(resultsAll.length).toBe(3);
    const allClose = resultsAll[0];
    const allMid = resultsAll[1];
    const allFar = resultsAll[2];
    expect(allClose).toBeDefined();
    expect(allMid).toBeDefined();
    expect(allFar).toBeDefined();
    if (!allClose || !allMid || !allFar) {
      throw new Error('Expected three nearby condominiums');
    }
    expect(allClose.condo.id).toBe(condoCloseId);
    expect(allMid.condo.id).toBe(condoMidId);
    expect(allFar.condo.id).toBe(condoFarId);
  });
});
