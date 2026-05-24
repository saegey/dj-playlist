""" Contains all the data models used in inputs/outputs """

from .add_friend_body import AddFriendBody
from .add_friend_response_200 import AddFriendResponse200
from .add_friend_response_400 import AddFriendResponse400
from .add_friend_response_500 import AddFriendResponse500
from .cleanup_playlist_sync_manifests_response_200 import CleanupPlaylistSyncManifestsResponse200
from .cleanup_playlist_sync_manifests_response_200_results_item import CleanupPlaylistSyncManifestsResponse200ResultsItem
from .cleanup_playlist_sync_manifests_response_200_summary import CleanupPlaylistSyncManifestsResponse200Summary
from .cleanup_playlist_sync_manifests_response_500 import CleanupPlaylistSyncManifestsResponse500
from .clear_all_jobs_response_200 import ClearAllJobsResponse200
from .clear_all_jobs_response_500 import ClearAllJobsResponse500
from .create_album_body import CreateAlbumBody
from .create_album_response_200 import CreateAlbumResponse200
from .create_album_response_200_album import CreateAlbumResponse200Album
from .create_album_response_200_tracks_item import CreateAlbumResponse200TracksItem
from .create_album_response_400 import CreateAlbumResponse400
from .create_album_response_404 import CreateAlbumResponse404
from .create_album_response_413 import CreateAlbumResponse413
from .create_album_response_500 import CreateAlbumResponse500
from .create_database_backup_custom_response_200 import CreateDatabaseBackupCustomResponse200
from .create_database_backup_custom_response_200_format import CreateDatabaseBackupCustomResponse200Format
from .create_database_backup_custom_response_500 import CreateDatabaseBackupCustomResponse500
from .create_database_backup_response_200 import CreateDatabaseBackupResponse200
from .create_database_backup_response_404 import CreateDatabaseBackupResponse404
from .create_database_backup_response_500 import CreateDatabaseBackupResponse500
from .create_playlist_body import CreatePlaylistBody
from .create_playlist_body_tracks_item import CreatePlaylistBodyTracksItem
from .create_playlist_response_201 import CreatePlaylistResponse201
from .create_playlist_response_201_tracks_item import CreatePlaylistResponse201TracksItem
from .create_playlist_response_500 import CreatePlaylistResponse500
from .delete_api_tracks_id_response_200 import DeleteApiTracksIdResponse200
from .delete_api_tracks_id_response_400 import DeleteApiTracksIdResponse400
from .delete_api_tracks_id_response_404 import DeleteApiTracksIdResponse404
from .delete_api_tracks_id_response_500 import DeleteApiTracksIdResponse500
from .delete_discogs_releases_body import DeleteDiscogsReleasesBody
from .delete_discogs_releases_response_200 import DeleteDiscogsReleasesResponse200
from .delete_discogs_releases_response_400 import DeleteDiscogsReleasesResponse400
from .delete_discogs_releases_response_500 import DeleteDiscogsReleasesResponse500
from .delete_playlist_response_200 import DeletePlaylistResponse200
from .delete_playlist_response_400 import DeletePlaylistResponse400
from .delete_playlist_response_404 import DeletePlaylistResponse404
from .generate_genetic_playlist_body import GenerateGeneticPlaylistBody
from .generate_genetic_playlist_body_playlist_item import GenerateGeneticPlaylistBodyPlaylistItem
from .generate_genetic_playlist_body_playlist_item_vectors import GenerateGeneticPlaylistBodyPlaylistItemVectors
from .generate_genetic_playlist_response_200 import GenerateGeneticPlaylistResponse200
from .generate_genetic_playlist_response_200_result_type_0_item import GenerateGeneticPlaylistResponse200ResultType0Item
from .generate_genetic_playlist_response_200_result_type_1 import GenerateGeneticPlaylistResponse200ResultType1
from .generate_genetic_playlist_response_200_result_type_1_additional_property import GenerateGeneticPlaylistResponse200ResultType1AdditionalProperty
from .generate_genetic_playlist_response_400 import GenerateGeneticPlaylistResponse400
from .generate_genetic_playlist_response_400_invalid_item import GenerateGeneticPlaylistResponse400InvalidItem
from .generate_genetic_playlist_response_500 import GenerateGeneticPlaylistResponse500
from .generate_provider_open_ai_track_metadata_body import GenerateProviderOpenAiTrackMetadataBody
from .generate_provider_open_ai_track_metadata_response_200 import GenerateProviderOpenAiTrackMetadataResponse200
from .generate_provider_open_ai_track_metadata_response_400 import GenerateProviderOpenAiTrackMetadataResponse400
from .generate_provider_open_ai_track_metadata_response_500 import GenerateProviderOpenAiTrackMetadataResponse500
from .get_ai_prompt_settings_response_200 import GetAiPromptSettingsResponse200
from .get_ai_prompt_settings_response_400 import GetAiPromptSettingsResponse400
from .get_ai_prompt_settings_response_500 import GetAiPromptSettingsResponse500
from .get_album_detail_response_200 import GetAlbumDetailResponse200
from .get_album_detail_response_200_album import GetAlbumDetailResponse200Album
from .get_album_detail_response_200_tracks_item import GetAlbumDetailResponse200TracksItem
from .get_album_detail_response_400 import GetAlbumDetailResponse400
from .get_album_detail_response_404 import GetAlbumDetailResponse404
from .get_album_detail_response_500 import GetAlbumDetailResponse500
from .get_album_discogs_raw_response_200 import GetAlbumDiscogsRawResponse200
from .get_album_discogs_raw_response_200_data import GetAlbumDiscogsRawResponse200Data
from .get_album_discogs_raw_response_400 import GetAlbumDiscogsRawResponse400
from .get_album_discogs_raw_response_404 import GetAlbumDiscogsRawResponse404
from .get_album_discogs_raw_response_500 import GetAlbumDiscogsRawResponse500
from .get_api_backups_filename_response_200 import GetApiBackupsFilenameResponse200
from .get_api_backups_filename_response_500 import GetApiBackupsFilenameResponse500
from .get_api_backups_response_200 import GetApiBackupsResponse200
from .get_api_backups_response_500 import GetApiBackupsResponse500
from .get_api_docs_response_200 import GetApiDocsResponse200
from .get_api_docs_response_500 import GetApiDocsResponse500
from .get_api_openapi_json_response_200 import GetApiOpenapiJsonResponse200
from .get_api_openapi_json_response_500 import GetApiOpenapiJsonResponse500
from .get_api_openapi_mobile_json_response_200 import GetApiOpenapiMobileJsonResponse200
from .get_api_openapi_mobile_json_response_500 import GetApiOpenapiMobileJsonResponse500
from .get_api_tracks_id_audio_metadata_response_200 import GetApiTracksIdAudioMetadataResponse200
from .get_api_tracks_id_audio_metadata_response_200_embedded_cover_type_0 import GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0
from .get_api_tracks_id_audio_metadata_response_200_probe import GetApiTracksIdAudioMetadataResponse200Probe
from .get_api_tracks_id_audio_metadata_response_400 import GetApiTracksIdAudioMetadataResponse400
from .get_api_tracks_id_audio_metadata_response_404 import GetApiTracksIdAudioMetadataResponse404
from .get_api_tracks_id_embedding_preview_response_200_type_0 import GetApiTracksIdEmbeddingPreviewResponse200Type0
from .get_api_tracks_id_embedding_preview_response_200_type_0_type import GetApiTracksIdEmbeddingPreviewResponse200Type0Type
from .get_api_tracks_id_embedding_preview_response_200_type_1 import GetApiTracksIdEmbeddingPreviewResponse200Type1
from .get_api_tracks_id_embedding_preview_response_200_type_1_data import GetApiTracksIdEmbeddingPreviewResponse200Type1Data
from .get_api_tracks_id_embedding_preview_response_200_type_1_type import GetApiTracksIdEmbeddingPreviewResponse200Type1Type
from .get_api_tracks_id_embedding_preview_response_200_type_2 import GetApiTracksIdEmbeddingPreviewResponse200Type2
from .get_api_tracks_id_embedding_preview_response_200_type_2_data import GetApiTracksIdEmbeddingPreviewResponse200Type2Data
from .get_api_tracks_id_embedding_preview_response_200_type_2_type import GetApiTracksIdEmbeddingPreviewResponse200Type2Type
from .get_api_tracks_id_embedding_preview_response_400 import GetApiTracksIdEmbeddingPreviewResponse400
from .get_api_tracks_id_embedding_preview_response_404 import GetApiTracksIdEmbeddingPreviewResponse404
from .get_api_tracks_id_embedding_preview_type import GetApiTracksIdEmbeddingPreviewType
from .get_api_tracks_id_essentia_response_200 import GetApiTracksIdEssentiaResponse200
from .get_api_tracks_id_essentia_response_200_data import GetApiTracksIdEssentiaResponse200Data
from .get_api_tracks_id_essentia_response_400 import GetApiTracksIdEssentiaResponse400
from .get_api_tracks_id_essentia_response_404 import GetApiTracksIdEssentiaResponse404
from .get_api_tracks_id_playlists_response_200 import GetApiTracksIdPlaylistsResponse200
from .get_api_tracks_id_playlists_response_200_playlists_item import GetApiTracksIdPlaylistsResponse200PlaylistsItem
from .get_api_tracks_id_playlists_response_400 import GetApiTracksIdPlaylistsResponse400
from .get_api_tracks_id_response_200 import GetApiTracksIdResponse200
from .get_api_tracks_id_response_400 import GetApiTracksIdResponse400
from .get_api_tracks_id_response_404 import GetApiTracksIdResponse404
from .get_backup_policy_response_200 import GetBackupPolicyResponse200
from .get_backup_policy_response_200_policy import GetBackupPolicyResponse200Policy
from .get_backup_policy_response_200_policy_provider import GetBackupPolicyResponse200PolicyProvider
from .get_backup_policy_response_200_policy_retention_preset import GetBackupPolicyResponse200PolicyRetentionPreset
from .get_backup_policy_response_500 import GetBackupPolicyResponse500
from .get_embedding_prompt_settings_response_200 import GetEmbeddingPromptSettingsResponse200
from .get_embedding_prompt_settings_response_400 import GetEmbeddingPromptSettingsResponse400
from .get_embedding_prompt_settings_response_500 import GetEmbeddingPromptSettingsResponse500
from .get_gamdl_settings_response_200 import GetGamdlSettingsResponse200
from .get_gamdl_settings_response_200_settings import GetGamdlSettingsResponse200Settings
from .get_gamdl_settings_response_400 import GetGamdlSettingsResponse400
from .get_gamdl_settings_response_500 import GetGamdlSettingsResponse500
from .get_job_by_id_response_400 import GetJobByIdResponse400
from .get_job_by_id_response_404 import GetJobByIdResponse404
from .get_job_by_id_response_500 import GetJobByIdResponse500
from .get_playlist_tracks_response_200 import GetPlaylistTracksResponse200
from .get_playlist_tracks_response_200_tracks_item import GetPlaylistTracksResponse200TracksItem
from .get_playlist_tracks_response_400 import GetPlaylistTracksResponse400
from .get_playlist_tracks_response_404 import GetPlaylistTracksResponse404
from .list_friends_response_200 import ListFriendsResponse200
from .list_friends_response_200_results_item import ListFriendsResponse200ResultsItem
from .list_friends_response_500 import ListFriendsResponse500
from .list_jobs_response_200 import ListJobsResponse200
from .list_jobs_response_200_jobs_item import ListJobsResponse200JobsItem
from .list_jobs_response_200_pagination import ListJobsResponse200Pagination
from .list_jobs_response_200_summary import ListJobsResponse200Summary
from .list_jobs_response_500 import ListJobsResponse500
from .list_jobs_state import ListJobsState
from .list_playlists_response_200_item import ListPlaylistsResponse200Item
from .list_playlists_response_200_item_tracks_item import ListPlaylistsResponse200ItemTracksItem
from .list_playlists_response_500 import ListPlaylistsResponse500
from .lookup_provider_discogs_release_response_200 import LookupProviderDiscogsReleaseResponse200
from .lookup_provider_discogs_release_response_200_matched_track import LookupProviderDiscogsReleaseResponse200MatchedTrack
from .lookup_provider_discogs_release_response_200_release import LookupProviderDiscogsReleaseResponse200Release
from .lookup_provider_discogs_release_response_400 import LookupProviderDiscogsReleaseResponse400
from .lookup_provider_discogs_release_response_404 import LookupProviderDiscogsReleaseResponse404
from .lookup_provider_discogs_release_response_500 import LookupProviderDiscogsReleaseResponse500
from .patch_api_tracks_body import PatchApiTracksBody
from .patch_api_tracks_response_200 import PatchApiTracksResponse200
from .patch_api_tracks_response_404 import PatchApiTracksResponse404
from .patch_api_tracks_response_500 import PatchApiTracksResponse500
from .post_api_restore_response_200 import PostApiRestoreResponse200
from .post_api_restore_response_500 import PostApiRestoreResponse500
from .post_api_tracks_analyze_async_body import PostApiTracksAnalyzeAsyncBody
from .post_api_tracks_analyze_async_response_200 import PostApiTracksAnalyzeAsyncResponse200
from .post_api_tracks_analyze_async_response_400 import PostApiTracksAnalyzeAsyncResponse400
from .post_api_tracks_analyze_async_response_500 import PostApiTracksAnalyzeAsyncResponse500
from .post_api_tracks_batch_body import PostApiTracksBatchBody
from .post_api_tracks_batch_body_tracks_item import PostApiTracksBatchBodyTracksItem
from .post_api_tracks_batch_response_200_item import PostApiTracksBatchResponse200Item
from .post_api_tracks_batch_response_500 import PostApiTracksBatchResponse500
from .post_api_tracks_id_audio_metadata_body import PostApiTracksIdAudioMetadataBody
from .post_api_tracks_id_audio_metadata_response_200 import PostApiTracksIdAudioMetadataResponse200
from .post_api_tracks_id_audio_metadata_response_400 import PostApiTracksIdAudioMetadataResponse400
from .post_api_tracks_id_audio_metadata_response_404 import PostApiTracksIdAudioMetadataResponse404
from .post_api_tracks_playlist_counts_body import PostApiTracksPlaylistCountsBody
from .post_api_tracks_playlist_counts_body_track_refs_item import PostApiTracksPlaylistCountsBodyTrackRefsItem
from .post_api_tracks_playlist_counts_response_200 import PostApiTracksPlaylistCountsResponse200
from .post_api_tracks_upload_body import PostApiTracksUploadBody
from .post_api_tracks_upload_response_200 import PostApiTracksUploadResponse200
from .post_api_tracks_upload_response_200_analysis import PostApiTracksUploadResponse200Analysis
from .post_api_tracks_upload_response_400 import PostApiTracksUploadResponse400
from .post_api_tracks_upload_response_500 import PostApiTracksUploadResponse500
from .queue_album_downloads_response_200 import QueueAlbumDownloadsResponse200
from .queue_album_downloads_response_400 import QueueAlbumDownloadsResponse400
from .queue_album_downloads_response_500 import QueueAlbumDownloadsResponse500
from .recommendation_candidates_batch_body import RecommendationCandidatesBatchBody
from .recommendation_candidates_batch_body_tracks_item import RecommendationCandidatesBatchBodyTracksItem
from .recommendation_candidates_batch_response_200 import RecommendationCandidatesBatchResponse200
from .recommendation_candidates_batch_response_200_candidates_item import RecommendationCandidatesBatchResponse200CandidatesItem
from .recommendation_candidates_batch_response_200_candidates_item_metadata import RecommendationCandidatesBatchResponse200CandidatesItemMetadata
from .recommendation_candidates_batch_response_200_seed_embeddings import RecommendationCandidatesBatchResponse200SeedEmbeddings
from .recommendation_candidates_batch_response_200_stats import RecommendationCandidatesBatchResponse200Stats
from .recommendation_candidates_batch_response_400 import RecommendationCandidatesBatchResponse400
from .recommendation_candidates_batch_response_404 import RecommendationCandidatesBatchResponse404
from .recommendation_candidates_batch_response_500 import RecommendationCandidatesBatchResponse500
from .recommendation_candidates_mode import RecommendationCandidatesMode
from .recommendation_candidates_response_200 import RecommendationCandidatesResponse200
from .recommendation_candidates_response_200_candidates_item import RecommendationCandidatesResponse200CandidatesItem
from .recommendation_candidates_response_200_candidates_item_metadata import RecommendationCandidatesResponse200CandidatesItemMetadata
from .recommendation_candidates_response_200_seed_embeddings import RecommendationCandidatesResponse200SeedEmbeddings
from .recommendation_candidates_response_200_stats import RecommendationCandidatesResponse200Stats
from .recommendation_candidates_response_400 import RecommendationCandidatesResponse400
from .recommendation_candidates_response_404 import RecommendationCandidatesResponse404
from .recommendation_candidates_response_500 import RecommendationCandidatesResponse500
from .remove_friend_response_400 import RemoveFriendResponse400
from .run_gamdl_action_body import RunGamdlActionBody
from .run_gamdl_action_body_action import RunGamdlActionBodyAction
from .run_gamdl_action_response_200 import RunGamdlActionResponse200
from .run_gamdl_action_response_400 import RunGamdlActionResponse400
from .run_gamdl_action_response_500 import RunGamdlActionResponse500
from .search_albums_missing_audio import SearchAlbumsMissingAudio
from .search_albums_missing_library_identifier import SearchAlbumsMissingLibraryIdentifier
from .search_albums_missing_local_cover_art_url import SearchAlbumsMissingLocalCoverArtUrl
from .search_albums_response_200 import SearchAlbumsResponse200
from .search_albums_response_200_hits_item import SearchAlbumsResponse200HitsItem
from .search_albums_response_500 import SearchAlbumsResponse500
from .search_provider_apple_music_body import SearchProviderAppleMusicBody
from .search_provider_apple_music_response_200 import SearchProviderAppleMusicResponse200
from .search_provider_apple_music_response_200_results_item import SearchProviderAppleMusicResponse200ResultsItem
from .search_provider_apple_music_response_500 import SearchProviderAppleMusicResponse500
from .search_provider_you_tube_music_body import SearchProviderYouTubeMusicBody
from .search_provider_you_tube_music_response_200 import SearchProviderYouTubeMusicResponse200
from .search_provider_you_tube_music_response_200_results_item import SearchProviderYouTubeMusicResponse200ResultsItem
from .search_provider_you_tube_music_response_500 import SearchProviderYouTubeMusicResponse500
from .search_tracks_query_response_200 import SearchTracksQueryResponse200
from .search_tracks_query_response_200_hits_item import SearchTracksQueryResponse200HitsItem
from .search_tracks_query_response_500 import SearchTracksQueryResponse500
from .stream_audio_file_response_400 import StreamAudioFileResponse400
from .stream_audio_file_response_404 import StreamAudioFileResponse404
from .stream_audio_file_response_416 import StreamAudioFileResponse416
from .stream_audio_file_response_500 import StreamAudioFileResponse500
from .sync_discogs_collection_stream_response_500 import SyncDiscogsCollectionStreamResponse500
from .update_ai_prompt_settings_body import UpdateAiPromptSettingsBody
from .update_ai_prompt_settings_response_200 import UpdateAiPromptSettingsResponse200
from .update_ai_prompt_settings_response_400 import UpdateAiPromptSettingsResponse400
from .update_ai_prompt_settings_response_500 import UpdateAiPromptSettingsResponse500
from .update_album_body import UpdateAlbumBody
from .update_album_response_200 import UpdateAlbumResponse200
from .update_album_response_200_album import UpdateAlbumResponse200Album
from .update_album_response_400 import UpdateAlbumResponse400
from .update_album_response_404 import UpdateAlbumResponse404
from .update_album_response_409 import UpdateAlbumResponse409
from .update_album_response_500 import UpdateAlbumResponse500
from .update_backup_policy_body import UpdateBackupPolicyBody
from .update_backup_policy_body_provider import UpdateBackupPolicyBodyProvider
from .update_backup_policy_body_retention_preset import UpdateBackupPolicyBodyRetentionPreset
from .update_backup_policy_response_200 import UpdateBackupPolicyResponse200
from .update_backup_policy_response_200_policy import UpdateBackupPolicyResponse200Policy
from .update_backup_policy_response_400 import UpdateBackupPolicyResponse400
from .update_backup_policy_response_500 import UpdateBackupPolicyResponse500
from .update_embedding_prompt_settings_body import UpdateEmbeddingPromptSettingsBody
from .update_embedding_prompt_settings_response_200 import UpdateEmbeddingPromptSettingsResponse200
from .update_embedding_prompt_settings_response_400 import UpdateEmbeddingPromptSettingsResponse400
from .update_embedding_prompt_settings_response_500 import UpdateEmbeddingPromptSettingsResponse500
from .update_gamdl_settings_body import UpdateGamdlSettingsBody
from .update_gamdl_settings_response_200 import UpdateGamdlSettingsResponse200
from .update_gamdl_settings_response_200_settings import UpdateGamdlSettingsResponse200Settings
from .update_gamdl_settings_response_400 import UpdateGamdlSettingsResponse400
from .update_gamdl_settings_response_500 import UpdateGamdlSettingsResponse500
from .update_playlist_body import UpdatePlaylistBody
from .update_playlist_body_tracks_item_type_1 import UpdatePlaylistBodyTracksItemType1
from .update_playlist_response_200 import UpdatePlaylistResponse200
from .update_playlist_response_200_tracks_item import UpdatePlaylistResponse200TracksItem
from .update_playlist_response_400 import UpdatePlaylistResponse400
from .update_playlist_response_404 import UpdatePlaylistResponse404
from .update_playlist_response_500 import UpdatePlaylistResponse500
from .upload_gamdl_cookie_file_body import UploadGamdlCookieFileBody
from .upload_gamdl_cookie_file_response_200 import UploadGamdlCookieFileResponse200
from .upload_gamdl_cookie_file_response_200_cookie_info import UploadGamdlCookieFileResponse200CookieInfo
from .upload_gamdl_cookie_file_response_400 import UploadGamdlCookieFileResponse400
from .upsert_album_with_tracks_body import UpsertAlbumWithTracksBody
from .upsert_album_with_tracks_response_200 import UpsertAlbumWithTracksResponse200
from .upsert_album_with_tracks_response_200_album import UpsertAlbumWithTracksResponse200Album
from .upsert_album_with_tracks_response_200_tracks_item import UpsertAlbumWithTracksResponse200TracksItem
from .upsert_album_with_tracks_response_400 import UpsertAlbumWithTracksResponse400
from .upsert_album_with_tracks_response_404 import UpsertAlbumWithTracksResponse404
from .upsert_album_with_tracks_response_413 import UpsertAlbumWithTracksResponse413
from .upsert_album_with_tracks_response_500 import UpsertAlbumWithTracksResponse500
from .verify_playlist_sync_manifests_response_200 import VerifyPlaylistSyncManifestsResponse200
from .verify_playlist_sync_manifests_response_200_results_item import VerifyPlaylistSyncManifestsResponse200ResultsItem
from .verify_playlist_sync_manifests_response_200_summary import VerifyPlaylistSyncManifestsResponse200Summary
from .verify_playlist_sync_manifests_response_500 import VerifyPlaylistSyncManifestsResponse500

__all__ = (
    "AddFriendBody",
    "AddFriendResponse200",
    "AddFriendResponse400",
    "AddFriendResponse500",
    "CleanupPlaylistSyncManifestsResponse200",
    "CleanupPlaylistSyncManifestsResponse200ResultsItem",
    "CleanupPlaylistSyncManifestsResponse200Summary",
    "CleanupPlaylistSyncManifestsResponse500",
    "ClearAllJobsResponse200",
    "ClearAllJobsResponse500",
    "CreateAlbumBody",
    "CreateAlbumResponse200",
    "CreateAlbumResponse200Album",
    "CreateAlbumResponse200TracksItem",
    "CreateAlbumResponse400",
    "CreateAlbumResponse404",
    "CreateAlbumResponse413",
    "CreateAlbumResponse500",
    "CreateDatabaseBackupCustomResponse200",
    "CreateDatabaseBackupCustomResponse200Format",
    "CreateDatabaseBackupCustomResponse500",
    "CreateDatabaseBackupResponse200",
    "CreateDatabaseBackupResponse404",
    "CreateDatabaseBackupResponse500",
    "CreatePlaylistBody",
    "CreatePlaylistBodyTracksItem",
    "CreatePlaylistResponse201",
    "CreatePlaylistResponse201TracksItem",
    "CreatePlaylistResponse500",
    "DeleteApiTracksIdResponse200",
    "DeleteApiTracksIdResponse400",
    "DeleteApiTracksIdResponse404",
    "DeleteApiTracksIdResponse500",
    "DeleteDiscogsReleasesBody",
    "DeleteDiscogsReleasesResponse200",
    "DeleteDiscogsReleasesResponse400",
    "DeleteDiscogsReleasesResponse500",
    "DeletePlaylistResponse200",
    "DeletePlaylistResponse400",
    "DeletePlaylistResponse404",
    "GenerateGeneticPlaylistBody",
    "GenerateGeneticPlaylistBodyPlaylistItem",
    "GenerateGeneticPlaylistBodyPlaylistItemVectors",
    "GenerateGeneticPlaylistResponse200",
    "GenerateGeneticPlaylistResponse200ResultType0Item",
    "GenerateGeneticPlaylistResponse200ResultType1",
    "GenerateGeneticPlaylistResponse200ResultType1AdditionalProperty",
    "GenerateGeneticPlaylistResponse400",
    "GenerateGeneticPlaylistResponse400InvalidItem",
    "GenerateGeneticPlaylistResponse500",
    "GenerateProviderOpenAiTrackMetadataBody",
    "GenerateProviderOpenAiTrackMetadataResponse200",
    "GenerateProviderOpenAiTrackMetadataResponse400",
    "GenerateProviderOpenAiTrackMetadataResponse500",
    "GetAiPromptSettingsResponse200",
    "GetAiPromptSettingsResponse400",
    "GetAiPromptSettingsResponse500",
    "GetAlbumDetailResponse200",
    "GetAlbumDetailResponse200Album",
    "GetAlbumDetailResponse200TracksItem",
    "GetAlbumDetailResponse400",
    "GetAlbumDetailResponse404",
    "GetAlbumDetailResponse500",
    "GetAlbumDiscogsRawResponse200",
    "GetAlbumDiscogsRawResponse200Data",
    "GetAlbumDiscogsRawResponse400",
    "GetAlbumDiscogsRawResponse404",
    "GetAlbumDiscogsRawResponse500",
    "GetApiBackupsFilenameResponse200",
    "GetApiBackupsFilenameResponse500",
    "GetApiBackupsResponse200",
    "GetApiBackupsResponse500",
    "GetApiDocsResponse200",
    "GetApiDocsResponse500",
    "GetApiOpenapiJsonResponse200",
    "GetApiOpenapiJsonResponse500",
    "GetApiOpenapiMobileJsonResponse200",
    "GetApiOpenapiMobileJsonResponse500",
    "GetApiTracksIdAudioMetadataResponse200",
    "GetApiTracksIdAudioMetadataResponse200EmbeddedCoverType0",
    "GetApiTracksIdAudioMetadataResponse200Probe",
    "GetApiTracksIdAudioMetadataResponse400",
    "GetApiTracksIdAudioMetadataResponse404",
    "GetApiTracksIdEmbeddingPreviewResponse200Type0",
    "GetApiTracksIdEmbeddingPreviewResponse200Type0Type",
    "GetApiTracksIdEmbeddingPreviewResponse200Type1",
    "GetApiTracksIdEmbeddingPreviewResponse200Type1Data",
    "GetApiTracksIdEmbeddingPreviewResponse200Type1Type",
    "GetApiTracksIdEmbeddingPreviewResponse200Type2",
    "GetApiTracksIdEmbeddingPreviewResponse200Type2Data",
    "GetApiTracksIdEmbeddingPreviewResponse200Type2Type",
    "GetApiTracksIdEmbeddingPreviewResponse400",
    "GetApiTracksIdEmbeddingPreviewResponse404",
    "GetApiTracksIdEmbeddingPreviewType",
    "GetApiTracksIdEssentiaResponse200",
    "GetApiTracksIdEssentiaResponse200Data",
    "GetApiTracksIdEssentiaResponse400",
    "GetApiTracksIdEssentiaResponse404",
    "GetApiTracksIdPlaylistsResponse200",
    "GetApiTracksIdPlaylistsResponse200PlaylistsItem",
    "GetApiTracksIdPlaylistsResponse400",
    "GetApiTracksIdResponse200",
    "GetApiTracksIdResponse400",
    "GetApiTracksIdResponse404",
    "GetBackupPolicyResponse200",
    "GetBackupPolicyResponse200Policy",
    "GetBackupPolicyResponse200PolicyProvider",
    "GetBackupPolicyResponse200PolicyRetentionPreset",
    "GetBackupPolicyResponse500",
    "GetEmbeddingPromptSettingsResponse200",
    "GetEmbeddingPromptSettingsResponse400",
    "GetEmbeddingPromptSettingsResponse500",
    "GetGamdlSettingsResponse200",
    "GetGamdlSettingsResponse200Settings",
    "GetGamdlSettingsResponse400",
    "GetGamdlSettingsResponse500",
    "GetJobByIdResponse400",
    "GetJobByIdResponse404",
    "GetJobByIdResponse500",
    "GetPlaylistTracksResponse200",
    "GetPlaylistTracksResponse200TracksItem",
    "GetPlaylistTracksResponse400",
    "GetPlaylistTracksResponse404",
    "ListFriendsResponse200",
    "ListFriendsResponse200ResultsItem",
    "ListFriendsResponse500",
    "ListJobsResponse200",
    "ListJobsResponse200JobsItem",
    "ListJobsResponse200Pagination",
    "ListJobsResponse200Summary",
    "ListJobsResponse500",
    "ListJobsState",
    "ListPlaylistsResponse200Item",
    "ListPlaylistsResponse200ItemTracksItem",
    "ListPlaylistsResponse500",
    "LookupProviderDiscogsReleaseResponse200",
    "LookupProviderDiscogsReleaseResponse200MatchedTrack",
    "LookupProviderDiscogsReleaseResponse200Release",
    "LookupProviderDiscogsReleaseResponse400",
    "LookupProviderDiscogsReleaseResponse404",
    "LookupProviderDiscogsReleaseResponse500",
    "PatchApiTracksBody",
    "PatchApiTracksResponse200",
    "PatchApiTracksResponse404",
    "PatchApiTracksResponse500",
    "PostApiRestoreResponse200",
    "PostApiRestoreResponse500",
    "PostApiTracksAnalyzeAsyncBody",
    "PostApiTracksAnalyzeAsyncResponse200",
    "PostApiTracksAnalyzeAsyncResponse400",
    "PostApiTracksAnalyzeAsyncResponse500",
    "PostApiTracksBatchBody",
    "PostApiTracksBatchBodyTracksItem",
    "PostApiTracksBatchResponse200Item",
    "PostApiTracksBatchResponse500",
    "PostApiTracksIdAudioMetadataBody",
    "PostApiTracksIdAudioMetadataResponse200",
    "PostApiTracksIdAudioMetadataResponse400",
    "PostApiTracksIdAudioMetadataResponse404",
    "PostApiTracksPlaylistCountsBody",
    "PostApiTracksPlaylistCountsBodyTrackRefsItem",
    "PostApiTracksPlaylistCountsResponse200",
    "PostApiTracksUploadBody",
    "PostApiTracksUploadResponse200",
    "PostApiTracksUploadResponse200Analysis",
    "PostApiTracksUploadResponse400",
    "PostApiTracksUploadResponse500",
    "QueueAlbumDownloadsResponse200",
    "QueueAlbumDownloadsResponse400",
    "QueueAlbumDownloadsResponse500",
    "RecommendationCandidatesBatchBody",
    "RecommendationCandidatesBatchBodyTracksItem",
    "RecommendationCandidatesBatchResponse200",
    "RecommendationCandidatesBatchResponse200CandidatesItem",
    "RecommendationCandidatesBatchResponse200CandidatesItemMetadata",
    "RecommendationCandidatesBatchResponse200SeedEmbeddings",
    "RecommendationCandidatesBatchResponse200Stats",
    "RecommendationCandidatesBatchResponse400",
    "RecommendationCandidatesBatchResponse404",
    "RecommendationCandidatesBatchResponse500",
    "RecommendationCandidatesMode",
    "RecommendationCandidatesResponse200",
    "RecommendationCandidatesResponse200CandidatesItem",
    "RecommendationCandidatesResponse200CandidatesItemMetadata",
    "RecommendationCandidatesResponse200SeedEmbeddings",
    "RecommendationCandidatesResponse200Stats",
    "RecommendationCandidatesResponse400",
    "RecommendationCandidatesResponse404",
    "RecommendationCandidatesResponse500",
    "RemoveFriendResponse400",
    "RunGamdlActionBody",
    "RunGamdlActionBodyAction",
    "RunGamdlActionResponse200",
    "RunGamdlActionResponse400",
    "RunGamdlActionResponse500",
    "SearchAlbumsMissingAudio",
    "SearchAlbumsMissingLibraryIdentifier",
    "SearchAlbumsMissingLocalCoverArtUrl",
    "SearchAlbumsResponse200",
    "SearchAlbumsResponse200HitsItem",
    "SearchAlbumsResponse500",
    "SearchProviderAppleMusicBody",
    "SearchProviderAppleMusicResponse200",
    "SearchProviderAppleMusicResponse200ResultsItem",
    "SearchProviderAppleMusicResponse500",
    "SearchProviderYouTubeMusicBody",
    "SearchProviderYouTubeMusicResponse200",
    "SearchProviderYouTubeMusicResponse200ResultsItem",
    "SearchProviderYouTubeMusicResponse500",
    "SearchTracksQueryResponse200",
    "SearchTracksQueryResponse200HitsItem",
    "SearchTracksQueryResponse500",
    "StreamAudioFileResponse400",
    "StreamAudioFileResponse404",
    "StreamAudioFileResponse416",
    "StreamAudioFileResponse500",
    "SyncDiscogsCollectionStreamResponse500",
    "UpdateAiPromptSettingsBody",
    "UpdateAiPromptSettingsResponse200",
    "UpdateAiPromptSettingsResponse400",
    "UpdateAiPromptSettingsResponse500",
    "UpdateAlbumBody",
    "UpdateAlbumResponse200",
    "UpdateAlbumResponse200Album",
    "UpdateAlbumResponse400",
    "UpdateAlbumResponse404",
    "UpdateAlbumResponse409",
    "UpdateAlbumResponse500",
    "UpdateBackupPolicyBody",
    "UpdateBackupPolicyBodyProvider",
    "UpdateBackupPolicyBodyRetentionPreset",
    "UpdateBackupPolicyResponse200",
    "UpdateBackupPolicyResponse200Policy",
    "UpdateBackupPolicyResponse400",
    "UpdateBackupPolicyResponse500",
    "UpdateEmbeddingPromptSettingsBody",
    "UpdateEmbeddingPromptSettingsResponse200",
    "UpdateEmbeddingPromptSettingsResponse400",
    "UpdateEmbeddingPromptSettingsResponse500",
    "UpdateGamdlSettingsBody",
    "UpdateGamdlSettingsResponse200",
    "UpdateGamdlSettingsResponse200Settings",
    "UpdateGamdlSettingsResponse400",
    "UpdateGamdlSettingsResponse500",
    "UpdatePlaylistBody",
    "UpdatePlaylistBodyTracksItemType1",
    "UpdatePlaylistResponse200",
    "UpdatePlaylistResponse200TracksItem",
    "UpdatePlaylistResponse400",
    "UpdatePlaylistResponse404",
    "UpdatePlaylistResponse500",
    "UploadGamdlCookieFileBody",
    "UploadGamdlCookieFileResponse200",
    "UploadGamdlCookieFileResponse200CookieInfo",
    "UploadGamdlCookieFileResponse400",
    "UpsertAlbumWithTracksBody",
    "UpsertAlbumWithTracksResponse200",
    "UpsertAlbumWithTracksResponse200Album",
    "UpsertAlbumWithTracksResponse200TracksItem",
    "UpsertAlbumWithTracksResponse400",
    "UpsertAlbumWithTracksResponse404",
    "UpsertAlbumWithTracksResponse413",
    "UpsertAlbumWithTracksResponse500",
    "VerifyPlaylistSyncManifestsResponse200",
    "VerifyPlaylistSyncManifestsResponse200ResultsItem",
    "VerifyPlaylistSyncManifestsResponse200Summary",
    "VerifyPlaylistSyncManifestsResponse500",
)
