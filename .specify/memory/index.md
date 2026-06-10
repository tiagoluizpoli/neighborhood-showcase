# Index

> **READ THIS FIRST.** Ralph Loop must read this file before any work.
> After completing or modifying any task or epic, update this file in the same turn.

## Grilling Sessions

- 📝 **Provider Section Reorg (2026-06-10)** — `sessions/2026-06-10-provider-section-reorg-grilling.md`. 25 decisions locked (User/Provider Profile strict split, full-width visual rule, slim dashboard, Meus Anúncios list + detail page, Configurações page, Conta e Segurança, public page full branding, Provedor sidebar fix, etc.). PRD-v7 added to the `/PRD.md` index as CURRENT; epic 13 created with 10 dependency-ordered task files.

## Epics

- ✅ **Auth and Registration** — `01-auth-and-registration/epic.md`
- ✅ **Condominium Management** — `02-condominium-management/epic.md`
- ✅ **Announcements and Payments** — `03-announcements-and-payments/epic.md`
- ✅ **Provider and Moderation** — `04-provider-and-moderation/epic.md`
- ✅ **Public Browsing UI** — `05-public-browsing-ui/epic.md`
- ✅ **Panel Layout** — `06-panel-layout/epic.md` (completed: all 9 tasks done)
- ✅ **Data and Infrastructure** — `07-data-and-infrastructure/epic.md`
- ✅ **Architecture and Quality** — `08-architecture-and-quality/epic.md`
- ✅ **Remediation** — `09-remediation/epic.md`
- ✅ **Playwright Setup** — `10-playwright-setup/epic.md` (completed: all 1 task done)
- 🔄 **i18n Namespace Fix and Navigation Hierarchy** — `11-i18n-and-navigation-fixes/epic.md` (blocked-by: 10-playwright-setup)
- 🔄 **Moderation Condominium Info and Context Selector** — `12-moderation-condo-context/epic.md` (blocked-by: 10-playwright-setup)
- 🔄 **Provider Section Reorg** — `13-provider-section-reorg/epic.md` (ready: 10 task files, dependency-ordered, source PRD-v7 is the CURRENT row in the `/PRD.md` index)

## All Tasks

| Epic | Task | Status | Blocked By |
|------|------|--------|------------|
| 01-auth-and-registration | [01_auth_cpf_validation](epics/01-auth-and-registration/tasks/01_auth_cpf_validation.md) | ✅ completed | — |
| 02-condominium-management | [02_condo_creation_sindico](epics/02-condominium-management/tasks/02_condo_creation_sindico.md) | ✅ completed | — |
| 02-condominium-management | [03_condo_joining_resident](epics/02-condominium-management/tasks/03_condo_joining_resident.md) | ✅ completed | — |
| 02-condominium-management | [04_condo_approval_admin](epics/02-condominium-management/tasks/04_condo_approval_admin.md) | ✅ completed | — |
| 02-condominium-management | [05_resident_approval_moderator](epics/02-condominium-management/tasks/05_resident_approval_moderator.md) | ✅ completed | — |
| 03-announcements-and-payments | [06_announcement_draft_creation](epics/03-announcements-and-payments/tasks/06_announcement_draft_creation.md) | ✅ completed | — |
| 03-announcements-and-payments | [07_payment_intent_pix](epics/03-announcements-and-payments/tasks/07_payment_intent_pix.md) | ✅ completed | — |
| 03-announcements-and-payments | [08_webhook_payment_resolution](epics/03-announcements-and-payments/tasks/08_webhook_payment_resolution.md) | ✅ completed | — |
| 03-announcements-and-payments | [09_public_showcase_discovery](epics/03-announcements-and-payments/tasks/09_public_showcase_discovery.md) | ✅ completed | — |
| 03-announcements-and-payments | [14_announcement_creation_auto_link](epics/03-announcements-and-payments/tasks/14_announcement_creation_auto_link.md) | ✅ completed | — |
| 03-announcements-and-payments | [17_draft_announcement_publish_button](epics/03-announcements-and-payments/tasks/17_draft_announcement_publish_button.md) | ✅ completed | — |
| 04-provider-and-moderation | [10_provider_dashboard_lgpd](epics/04-provider-and-moderation/tasks/10_provider_dashboard_lgpd.md) | ✅ completed | — |
| 04-provider-and-moderation | [11_moderator_suspension_admin_blacklist](epics/04-provider-and-moderation/tasks/11_moderator_suspension_admin_blacklist.md) | ✅ completed | — |
| 04-provider-and-moderation | [53_moderation_queue_admin_review](epics/04-provider-and-moderation/tasks/53_moderation_queue_admin_review.md) | ✅ completed | — |
| 04-provider-and-moderation | [54_admin_directory_role_management](epics/04-provider-and-moderation/tasks/54_admin_directory_role_management.md) | ✅ completed | — |
| 05-public-browsing-ui | [39_portal_panel_route_layout_separation](epics/05-public-browsing-ui/tasks/39_portal_panel_route_layout_separation.md) | ✅ completed | — |
| 05-public-browsing-ui | [56_public_browsing_header_separation](epics/05-public-browsing-ui/tasks/56_public_browsing_header_separation.md) | ✅ completed | — |
| 05-public-browsing-ui | [57_home_location_control_geolocation_confidence_cleanup](epics/05-public-browsing-ui/tasks/57_home_location_control_geolocation_confidence_cleanup.md) | ✅ completed | — |
| 05-public-browsing-ui | [58_home_discovery_layout_first_viewport_cleanup](epics/05-public-browsing-ui/tasks/58_home_discovery_layout_first_viewport_cleanup.md) | ✅ completed | — |
| 05-public-browsing-ui | [59_announcement_card_spectrum_inspired_redesign](epics/05-public-browsing-ui/tasks/59_announcement_card_spectrum_inspired_redesign.md) | ✅ completed | — |
| 05-public-browsing-ui | [60_announcement_detail_navigation_source_of_truth](epics/05-public-browsing-ui/tasks/60_announcement_detail_navigation_source_of_truth.md) | ✅ completed | — |
| 05-public-browsing-ui | [61_home_feed_loading_empty_error_states](epics/05-public-browsing-ui/tasks/61_home_feed_loading_empty_error_states.md) | ✅ completed | — |
| 05-public-browsing-ui | [62_backend_managed_announcement_categories](epics/05-public-browsing-ui/tasks/62_backend_managed_announcement_categories.md) | ✅ completed | — |
| 06-panel-layout | [06_01_sidebar_foundation](epics/06-panel-layout/tasks/06_01_sidebar_foundation.md) | ✅ completed | — |
| 06-panel-layout | [06_02_nested_navigation](epics/06-panel-layout/tasks/06_02_nested_navigation.md) | ✅ completed | — |
| 06-panel-layout | [06_03_sidebar_footer](epics/06-panel-layout/tasks/06_03_sidebar_footer.md) | ✅ completed | — |
| 06-panel-layout | [06_04_top_bar_controls](epics/06-panel-layout/tasks/06_04_top_bar_controls.md) | ✅ completed | — |
| 06-panel-layout | [06_05_sidebar_persistence](epics/06-panel-layout/tasks/06_05_sidebar_persistence.md) | ✅ completed | — |
| 06-panel-layout | [06_06_localization](epics/06-panel-layout/tasks/06_06_localization.md) | ✅ completed | — |
| 06-panel-layout | [06_07_badge_count_stubs](epics/06-panel-layout/tasks/06_07_badge_count_stubs.md) | ✅ completed | — |
| 06-panel-layout | [06_08_visibility_tests](epics/06-panel-layout/tasks/06_08_visibility_tests.md) | ✅ completed | — |
| 06-panel-layout | [06_09_spectrum_top_level_block](epics/06-panel-layout/tasks/06_09_spectrum_top_level_block.md) | ✅ completed | [06_07_badge_count_stubs](epics/06-panel-layout/tasks/06_07_badge_count_stubs.md) |
| 07-data-and-infrastructure | [12_db_migration_address_location](epics/07-data-and-infrastructure/tasks/12_db_migration_address_location.md) | ✅ completed | — |
| 07-data-and-infrastructure | [13_onboarding_setup_flow_external](epics/07-data-and-infrastructure/tasks/13_onboarding_setup_flow_external.md) | ✅ completed | — |
| 07-data-and-infrastructure | [15_public_showcase_proximity_refactor](epics/07-data-and-infrastructure/tasks/15_public_showcase_proximity_refactor.md) | ✅ completed | — |
| 07-data-and-infrastructure | [16_rename_project_references](epics/07-data-and-infrastructure/tasks/16_rename_project_references.md) | ✅ completed | — |
| 07-data-and-infrastructure | [18_purge_legacy_todo_code](epics/07-data-and-infrastructure/tasks/18_purge_legacy_todo_code.md) | ✅ completed | — |
| 07-data-and-infrastructure | [26_analytics_impression_tracker](epics/07-data-and-infrastructure/tasks/26_analytics_impression_tracker.md) | ✅ completed | — |
| 07-data-and-infrastructure | [27_docker_compose_infrastructure](epics/07-data-and-infrastructure/tasks/27_docker_compose_infrastructure.md) | ✅ completed | — |
| 07-data-and-infrastructure | [28_native_pg_enum_schema_migration](epics/07-data-and-infrastructure/tasks/28_native_pg_enum_schema_migration.md) | ✅ completed | — |
| 07-data-and-infrastructure | [29_feature_flags_shared_package](epics/07-data-and-infrastructure/tasks/29_feature_flags_shared_package.md) | ✅ completed | — |
| 07-data-and-infrastructure | [30_entity_validation_encapsulation](epics/07-data-and-infrastructure/tasks/30_entity_validation_encapsulation.md) | ✅ completed | — |
| 07-data-and-infrastructure | [31_resolve_dev_boot_errors](epics/07-data-and-infrastructure/tasks/31_resolve_dev_boot_errors.md) | ✅ completed | — |
| 07-data-and-infrastructure | [32_abacatepay_webhook_fixes](epics/07-data-and-infrastructure/tasks/32_abacatepay_webhook_fixes.md) | ✅ completed | — |
| 07-data-and-infrastructure | [33_webhook_query_schema_and_types](epics/07-data-and-infrastructure/tasks/33_webhook_query_schema_and_types.md) | ✅ completed | — |
| 07-data-and-infrastructure | [34_webhook_zod_payload_and_status](epics/07-data-and-infrastructure/tasks/34_webhook_zod_payload_and_status.md) | ✅ completed | — |
| 07-data-and-infrastructure | [35_webhook_background_email](epics/07-data-and-infrastructure/tasks/35_webhook_background_email.md) | ✅ completed | — |
| 07-data-and-infrastructure | [36_webhook_integration_tests_alignment](epics/07-data-and-infrastructure/tasks/36_webhook_integration_tests_alignment.md) | ✅ completed | — |
| 07-data-and-infrastructure | [37_visual_foundation_shadcn_reset](epics/07-data-and-infrastructure/tasks/37_visual_foundation_shadcn_reset.md) | ✅ completed | — |
| 07-data-and-infrastructure | [38_postgis_schema_geospatial_columns](epics/07-data-and-infrastructure/tasks/38_postgis_schema_geospatial_columns.md) | ✅ completed | — |
| 08-architecture-and-quality | [19_styling_simplification](epics/08-architecture-and-quality/tasks/19_styling_simplification.md) | ✅ completed | — |
| 08-architecture-and-quality | [20_permission_navigation_localization](epics/08-architecture-and-quality/tasks/20_permission_navigation_localization.md) | ✅ completed | — |
| 08-architecture-and-quality | [21_fix_infinite_payment_tracking_loop](epics/08-architecture-and-quality/tasks/21_fix_infinite_payment_tracking_loop.md) | ✅ completed | — |
| 08-architecture-and-quality | [22_ddd_domain_entity_class_refactoring](epics/08-architecture-and-quality/tasks/22_ddd_domain_entity_class_refactoring.md) | ✅ completed | — |
| 08-architecture-and-quality | [23_unleash_feature_flagging](epics/08-architecture-and-quality/tasks/23_unleash_feature_flagging.md) | ✅ completed | — |
| 08-architecture-and-quality | [24_i18n_localization_en_pt](epics/08-architecture-and-quality/tasks/24_i18n_localization_en_pt.md) | ✅ completed | — |
| 08-architecture-and-quality | [25_payment_error_handling_adr](epics/08-architecture-and-quality/tasks/25_payment_error_handling_adr.md) | ✅ completed | — |
| 08-architecture-and-quality | [55_backend_clean_architecture_sweep](epics/08-architecture-and-quality/tasks/55_backend_clean_architecture_sweep.md) | ✅ completed | — |
| 08-architecture-and-quality | [63_backend_domain_alignment_and_clean_architecture_completion](epics/08-architecture-and-quality/tasks/63_backend_domain_alignment_and_clean_architecture_completion.md) | ✅ completed | — |
| 08-architecture-and-quality | [64_public_browsing_shell_navigation_completion](epics/08-architecture-and-quality/tasks/64_public_browsing_shell_navigation_completion.md) | ✅ completed | — |
| 09-remediation | [65_whole_codebase_review_remediation_backlog](epics/09-remediation/tasks/65_whole_codebase_review_remediation_backlog.md) | ✅ completed | — |
| 09-remediation | [66_admin_global_access_route_parity](epics/09-remediation/tasks/66_admin_global_access_route_parity.md) | ✅ completed | — |
| 09-remediation | [67_provider_profile_public_visibility_enforcement](epics/09-remediation/tasks/67_provider_profile_public_visibility_enforcement.md) | ✅ completed | — |
| 09-remediation | [68_provider_profile_explicit_provisioning_and_pure_reads](epics/09-remediation/tasks/68_provider_profile_explicit_provisioning_and_pure_reads.md) | ✅ completed | — |
| 09-remediation | [69_announcement_server_interface_decomposition](epics/09-remediation/tasks/69_announcement_server_interface_decomposition.md) | ✅ completed | — |
| 09-remediation | [70_public_vitrine_route_family_decomposition](epics/09-remediation/tasks/70_public_vitrine_route_family_decomposition.md) | ✅ completed | — |
| 09-remediation | [71_provider_dashboard_route_family_decomposition](epics/09-remediation/tasks/71_provider_dashboard_route_family_decomposition.md) | ✅ completed | — |
| 09-remediation | [72_moderation_admin_route_family_decomposition](epics/09-remediation/tasks/72_moderation_admin_route_family_decomposition.md) | ✅ completed | — |
| 09-remediation | [73_frontend_export_surface_and_bundle_cleanup](epics/09-remediation/tasks/73_frontend_export_surface_and_bundle_cleanup.md) | ✅ completed | — |
| 10-playwright-setup | [01_playwright_setup](epics/10-playwright-setup/tasks/01_playwright_setup.md) | ✅ completed | — |
| 11-i18n-and-navigation-fixes | [01_i18n_namespace_fix](epics/11-i18n-and-navigation-fixes/tasks/01_i18n_namespace_fix.md) | ✅ completed | 10-playwright-setup |
| 11-i18n-and-navigation-fixes | [02_provider_navigation_flatten](epics/11-i18n-and-navigation-fixes/tasks/02_provider_navigation_flatten.md) | ✅ completed | 10-playwright-setup |
| 11-i18n-and-navigation-fixes | [03_spectrum_item_hierarchy_fix](epics/11-i18n-and-navigation-fixes/tasks/03_spectrum_item_hierarchy_fix.md) | 🔄 in-progress (blocked: no ADMINISTRATOR user seeded) | 10-playwright-setup |
| 12-moderation-condo-context | [01_moderation_condo_info_backend](epics/12-moderation-condo-context/tasks/01_moderation_condo_info_backend.md) | ✅ completed | 10-playwright-setup |
| 12-moderation-condo-context | [02_moderation_condo_info_frontend](epics/12-moderation-condo-context/tasks/02_moderation_condo_info_frontend.md) | ✅ completed | 01_moderation_condo_info_backend |
| 12-moderation-condo-context | [03_moderation_condo_context_selector](epics/12-moderation-condo-context/tasks/03_moderation_condo_context_selector.md) | 🔄 ready | 01_moderation_condo_info_backend |
| 13-provider-section-reorg | [01_schema_migrations](epics/13-provider-section-reorg/tasks/01_schema_migrations.md) | ✅ completed | — |
| 13-provider-section-reorg | [02_provider_profile_backend](epics/13-provider-section-reorg/tasks/02_provider_profile_backend.md) | ✅ completed | 01_schema_migrations |
| 13-provider-section-reorg | [03_provider_profile_router](epics/13-provider-section-reorg/tasks/03_provider_profile_router.md) | 🔄 ready | 02_provider_profile_backend |
| 13-provider-section-reorg | [04_shrink_user_update_and_dtos](epics/13-provider-section-reorg/tasks/04_shrink_user_update_and_dtos.md) | 🔄 ready | 03_provider_profile_router |
| 13-provider-section-reorg | [05_configuracoes_page](epics/13-provider-section-reorg/tasks/05_configuracoes_page.md) | 🔄 ready | 04_shrink_user_update_and_dtos |
| 13-provider-section-reorg | [06_conta_e_seguranca](epics/13-provider-section-reorg/tasks/06_conta_e_seguranca.md) | 🔄 ready | 05_configuracoes_page |
| 13-provider-section-reorg | [07_meus_anuncios_list](epics/13-provider-section-reorg/tasks/07_meus_anuncios_list.md) | 🔄 ready | 06_conta_e_seguranca |
| 13-provider-section-reorg | [08_meus_anuncios_detail](epics/13-provider-section-reorg/tasks/08_meus_anuncios_detail.md) | 🔄 ready | 07_meus_anuncios_list |
| 13-provider-section-reorg | [09_dashboard_slim_and_sidebar](epics/13-provider-section-reorg/tasks/09_dashboard_slim_and_sidebar.md) | 🔄 ready | 08_meus_anuncios_detail |
| 13-provider-section-reorg | [10_public_page_and_adrs](epics/13-provider-section-reorg/tasks/10_public_page_and_adrs.md) | 🔄 ready | 09_dashboard_slim_and_sidebar |