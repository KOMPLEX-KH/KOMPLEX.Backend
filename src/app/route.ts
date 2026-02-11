import Router from "express";

// ============================================================================
// Authentication Routes
// ============================================================================
import { postSignup } from "./api/v2/komplex/auth/signup/post.js";
import { postSocialLogIn } from "./api/v2/komplex/auth/social-login/post.js";

// ============================================================================
// Upload Routes
// ============================================================================
import { postUploadUrl } from "./api/v2/komplex/upload-url/post.js";

// ============================================================================
// Feed Routes
// ============================================================================

// Videos
import { getAllVideos } from "./api/v2/komplex/feed/videos/get.js";
import { getVideoById } from "./api/v2/komplex/feed/videos/[id]/get.js";
import { getRecommendedVideos } from "./api/v2/komplex/feed/videos/[id]/recommended/get.js";
import { getVideoLikes } from "./api/v2/komplex/feed/videos/[id]/likes/get.js";
import { getVideoComments } from "./api/v2/komplex/feed/videos/[id]/comments/get.js";
import { getVideoReplies } from "./api/v2/komplex/feed/videos/[id]/comments/[id]/replies/get.js";

// Forums
import { getAllForums as getAllFeedForums } from "./api/v2/komplex/feed/forums/get.js";
import { getForumById } from "./api/v2/komplex/feed/forums/[id]/get.js";
import { getForumComments } from "./api/v2/komplex/feed/forums/[id]/comments/get.js";
import { getForumReplies } from "./api/v2/komplex/feed/forums/[id]/comments/[id]/replies/get.js";

// News
import { getAllNews } from "./api/v2/komplex/feed/news/get.js";
import { getNewsById } from "./api/v2/komplex/feed/news/[id]/get.js";

// Exercises
import { getExercises } from "./api/v2/komplex/feed/exercises/get.js";
import { getExerciseById } from "./api/v2/komplex/feed/exercises/[id]/get.js";

// Curriculums
import { getCurriculums } from "./api/v2/komplex/feed/curriculums/get.js";
import { getCurriculumTopic } from "./api/v2/komplex/feed/curriculums/[id]/get.js";

// ============================================================================
// Search Routes
// ============================================================================
import { searchVideos } from "./api/v2/komplex/search/videos/get.js";
import { searchForums } from "./api/v2/komplex/search/forums/get.js";
import { searchNews } from "./api/v2/komplex/search/news/get.js";

// ============================================================================
// Users Routes
// ============================================================================
import { getUserProfile } from "./api/v2/komplex/users/[id]/profile/get.js";
import { getUserVideos } from "./api/v2/komplex/users/[id]/videos/get.js";
import { getUserForums } from "./api/v2/komplex/users/[id]/forums/get.js";

// ============================================================================
// Me Routes
// ============================================================================

// Profile
import { getMe } from "./api/v2/komplex/me/get.js";
import { getMeProfile } from "./api/v2/komplex/me/profile/get.js";
import { getMeDashboard } from "./api/v2/komplex/me/dashboard/get.js";
import { getLastAccessed } from "./api/v2/komplex/me/last-accessed/get.js";
import { getMyVideoHistory } from "./api/v2/komplex/me/video-history/get.js";
import { postFeedback } from "./api/v2/komplex/me/feedback/post.js";

// Follow
import { getFollowers } from "./api/v2/komplex/me/follow/followers/get.js";
import { getFollowing } from "./api/v2/komplex/me/follow/following/get.js";
import { followUser } from "./api/v2/komplex/me/follow/follow/[id]/post.js";
import { unfollowUser } from "./api/v2/komplex/me/follow/unfollow/[id]/post.js";

// Videos
import { getAllMyVideos } from "./api/v2/komplex/me/videos/get.js";
import { postVideo } from "./api/v2/komplex/me/videos/post.js";
import { updateVideo } from "./api/v2/komplex/me/videos/[id]/put.js";
import { deleteVideo } from "./api/v2/komplex/me/videos/[id]/delete.js";
import { likeVideo } from "./api/v2/komplex/me/videos/[id]/like/patch.js";
import { unlikeVideo } from "./api/v2/komplex/me/videos/[id]/unlike/patch.js";
import { postVideoComment } from "./api/v2/komplex/me/videos/[id]/comments/post.js";
import { updateVideoComment } from "./api/v2/komplex/me/videos/[id]/comments/[id]/put.js";
import { deleteVideoComment } from "./api/v2/komplex/me/videos/[id]/comments/[id]/delete.js";
import { likeVideoComment } from "./api/v2/komplex/me/videos/[id]/comments/[id]/like/patch.js";
import { unlikeVideoComment } from "./api/v2/komplex/me/videos/[id]/comments/[id]/unlike/patch.js";
import { postVideoReply } from "./api/v2/komplex/me/videos/[id]/comments/[id]/replies/post.js";
import { updateVideoReply } from "./api/v2/komplex/me/videos/[id]/comments/[id]/replies/[id]/put.js";
import { deleteVideoReply } from "./api/v2/komplex/me/videos/[id]/comments/[id]/replies/[id]/delete.js";
import { likeVideoReply } from "./api/v2/komplex/me/videos/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeVideoReply } from "./api/v2/komplex/me/videos/[id]/comments/[id]/replies/[id]/unlike/patch.js";

// Forums
import { getAllForums as getAllMyForums } from "./api/v2/komplex/me/forums/get.js";
import { postForum } from "./api/v2/komplex/me/forums/post.js";
import { updateForum } from "./api/v2/komplex/me/forums/[id]/put.js";
import { deleteForum } from "./api/v2/komplex/me/forums/[id]/delete.js";
import { likeForum } from "./api/v2/komplex/me/forums/[id]/like/patch.js";
import { unlikeForum } from "./api/v2/komplex/me/forums/[id]/unlike/patch.js";
import { postForumComment } from "./api/v2/komplex/me/forums/[id]/comments/post.js";
import { updateForumComment } from "./api/v2/komplex/me/forums/[id]/comments/[id]/put.js";
import { deleteForumComment } from "./api/v2/komplex/me/forums/[id]/comments/[id]/delete.js";
import { likeForumComment } from "./api/v2/komplex/me/forums/[id]/comments/[id]/like/patch.js";
import { unlikeForumComment } from "./api/v2/komplex/me/forums/[id]/comments/[id]/unlike/patch.js";
import { postForumReply } from "./api/v2/komplex/me/forums/[id]/comments/[id]/replies/post.js";
import { updateForumReply } from "./api/v2/komplex/me/forums/[id]/comments/[id]/replies/[id]/put.js";
import { deleteForumReply } from "./api/v2/komplex/me/forums/[id]/comments/[id]/replies/[id]/delete.js";
import { likeForumReply } from "./api/v2/komplex/me/forums/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeForumReply } from "./api/v2/komplex/me/forums/[id]/comments/[id]/replies/[id]/unlike/patch.js";

// Notes (not yet implemented in v2)
// import { getNotes } from "./api/v2/komplex/me/notes/get.js";
// import { postNote } from "./api/v2/komplex/me/notes/post.js";
// import { getNoteById } from "./api/v2/komplex/me/notes/[id]/get.js";
// import { updateNote } from "./api/v2/komplex/me/notes/[id]/put.js";
// import { deleteNote } from "./api/v2/komplex/me/notes/[id]/delete.js";

// Exercises (not yet implemented in v2)
// import { getExerciseDashboard } from "./api/v2/komplex/me/exercises/dashboard/get.js";
// import { getExerciseHistory } from "./api/v2/komplex/me/exercises/history/get.js";
// import { getExerciseReport } from "./api/v2/komplex/me/exercises/[id]/report/get.js";
// import { submitExercise } from "./api/v2/komplex/me/exercises/[id]/submit/post.js";

// AI
import { getAllAiGeneralTabs } from "./api/v2/komplex/me/ai/general/tabs/get.js";
import { createAiGeneralTab } from "./api/v2/komplex/me/ai/general/tabs/post.js";
import { getAiGeneralTabHistory } from "./api/v2/komplex/me/ai/general/tabs/[id]/get.js";
import { callAiGeneral } from "./api/v2/komplex/me/ai/general/tabs/[id]/post.js";
import { updateAiGeneralTab } from "./api/v2/komplex/me/ai/general/tabs/[id]/put.js";
import { deleteAiGeneralTab } from "./api/v2/komplex/me/ai/general/tabs/[id]/delete.js";
import { rateAiGeneralResponse } from "./api/v2/komplex/me/ai/general/rating/[id]/post.js";
import { getAllAiTopics } from "./api/v2/komplex/me/ai/topics/get.js";
import { getAiTopicHistory } from "./api/v2/komplex/me/ai/topics/[id]/get.js";
import { callAiTopic } from "./api/v2/komplex/me/ai/topics/[id]/post.js";
import { deleteAiTopic } from "./api/v2/komplex/me/ai/topics/[id]/delete.js";
import { rateAiTopicResponse } from "./api/v2/komplex/me/ai/topics/rating/[id]/post.js";

const BASE_API = "/api/komplex";
const ADMIN_BASE_API = "/api/komplex-admin";
const router = Router();

// ============================================================================
// Authentication Routes
// ============================================================================
router.get(`${BASE_API}/auth/signup`, postSignup);
router.get(`${BASE_API}/auth/social-login`, postSocialLogIn as any);

// ============================================================================
// Upload Routes
// ============================================================================
router.post(`${BASE_API}/upload/upload-url`, postUploadUrl as any);

// ============================================================================
// Feed Routes
// ============================================================================
const FEED_API = `${BASE_API}/feed`;

// Videos
const VIDEO_FEED_API = `${FEED_API}/videos`;
router.get(`${VIDEO_FEED_API}`, getAllVideos as any);
router.get(`${VIDEO_FEED_API}/:id`, getVideoById as any);
router.get(`${VIDEO_FEED_API}/:id/recommended`, getRecommendedVideos as any);
router.get(`${VIDEO_FEED_API}/:id/likes`, getVideoLikes as any);
router.get(`${VIDEO_FEED_API}/:id/comments`, getVideoComments as any);
router.get(`${VIDEO_FEED_API}/:id/comments/:id/replies`, getVideoReplies as any);

// Forums
const FORUM_FEED_API = `${FEED_API}/forums`;
router.get(`${FORUM_FEED_API}`, getAllFeedForums as any);
router.get(`${FORUM_FEED_API}/:id`, getForumById as any);
router.get(`${FORUM_FEED_API}/:id/comments`, getForumComments as any);
router.get(`${FORUM_FEED_API}/:id/comments/:id/replies`, getForumReplies as any);

// News
const NEWS_FEED_API = `${FEED_API}/news`;
router.get(`${NEWS_FEED_API}`, getAllNews as any);
router.get(`${NEWS_FEED_API}/:id`, getNewsById as any);

// Exercises
const EXERCISES_FEED_API = `${FEED_API}/exercises`;
router.get(`${EXERCISES_FEED_API}`, getExercises as any);
router.get(`${EXERCISES_FEED_API}/:id`, getExerciseById as any);

// Curriculums
const CURRICULUMS_FEED_API = `${FEED_API}/curriculums`;
router.get(`${CURRICULUMS_FEED_API}`, getCurriculums as any);
router.get(`${CURRICULUMS_FEED_API}/:id`, getCurriculumTopic as any);

// ============================================================================
// Search Routes
// ============================================================================
const SEARCH_API = `${BASE_API}/search`;
router.get(`${SEARCH_API}/videos`, searchVideos as any);
router.get(`${SEARCH_API}/forums`, searchForums as any);
router.get(`${SEARCH_API}/news`, searchNews as any);

// ============================================================================
// Users Routes
// ============================================================================
const USERS_API = `${BASE_API}/users`;
router.get(`${USERS_API}/:id/profile`, getUserProfile as any);
router.get(`${USERS_API}/:id/videos`, getUserVideos as any);
router.get(`${USERS_API}/:id/forums`, getUserForums as any);

// ============================================================================
// Me Routes
// ============================================================================
const ME_API = `${BASE_API}/me`;

// Profile
router.get(`${ME_API}`, getMe as any);
router.get(`${ME_API}/profile`, getMeProfile as any);
router.get(`${ME_API}/dashboard`, getMeDashboard as any);
router.get(`${ME_API}/last-accessed`, getLastAccessed as any);
router.get(`${ME_API}/video-history`, getMyVideoHistory as any);
router.post(`${ME_API}/feedback`, postFeedback as any);

// Follow
const FOLLOW_API = `${ME_API}/follow`;
router.get(`${FOLLOW_API}/followers`, getFollowers as any);
router.get(`${FOLLOW_API}/following`, getFollowing as any);
router.post(`${FOLLOW_API}/follow/:id`, followUser as any);
router.post(`${FOLLOW_API}/unfollow/:id`, unfollowUser as any);

// Videos
const ME_VIDEOS_API = `${ME_API}/videos`;
router.get(`${ME_VIDEOS_API}`, getAllMyVideos as any);
router.post(`${ME_VIDEOS_API}`, postVideo as any);
router.put(`${ME_VIDEOS_API}/:id`, updateVideo as any);
router.delete(`${ME_VIDEOS_API}/:id`, deleteVideo as any);
router.patch(`${ME_VIDEOS_API}/:id/like`, likeVideo as any);
router.patch(`${ME_VIDEOS_API}/:id/unlike`, unlikeVideo as any);
router.post(`${ME_VIDEOS_API}/:id/comments`, postVideoComment as any);
router.put(`${ME_VIDEOS_API}/:id/comments/:id`, updateVideoComment as any);
router.delete(`${ME_VIDEOS_API}/:id/comments/:id`, deleteVideoComment as any);
router.patch(`${ME_VIDEOS_API}/:id/comments/:id/like`, likeVideoComment as any);
router.patch(`${ME_VIDEOS_API}/:id/comments/:id/unlike`, unlikeVideoComment as any);
router.post(`${ME_VIDEOS_API}/:id/comments/:id/replies`, postVideoReply as any);
router.put(`${ME_VIDEOS_API}/:id/comments/:id/replies/:id`, updateVideoReply as any);
router.delete(`${ME_VIDEOS_API}/:id/comments/:id/replies/:id`, deleteVideoReply as any);
router.patch(`${ME_VIDEOS_API}/:id/comments/:id/replies/:id/like`, likeVideoReply as any);
router.patch(`${ME_VIDEOS_API}/:id/comments/:id/replies/:id/unlike`, unlikeVideoReply as any);

// Forums
const ME_FORUMS_API = `${ME_API}/forums`;
router.get(`${ME_FORUMS_API}`, getAllMyForums as any);
router.post(`${ME_FORUMS_API}`, postForum as any);
router.put(`${ME_FORUMS_API}/:id`, updateForum as any);
router.delete(`${ME_FORUMS_API}/:id`, deleteForum as any);
router.patch(`${ME_FORUMS_API}/:id/like`, likeForum as any);
router.patch(`${ME_FORUMS_API}/:id/unlike`, unlikeForum as any);
router.post(`${ME_FORUMS_API}/:id/comments`, postForumComment as any);
router.put(`${ME_FORUMS_API}/:id/comments/:id`, updateForumComment as any);
router.delete(`${ME_FORUMS_API}/:id/comments/:id`, deleteForumComment as any);
router.patch(`${ME_FORUMS_API}/:id/comments/:id/like`, likeForumComment as any);
router.patch(`${ME_FORUMS_API}/:id/comments/:id/unlike`, unlikeForumComment as any);
router.post(`${ME_FORUMS_API}/:id/comments/:id/replies`, postForumReply as any);
router.put(`${ME_FORUMS_API}/:id/comments/:id/replies/:id`, updateForumReply as any);
router.delete(`${ME_FORUMS_API}/:id/comments/:id/replies/:id`, deleteForumReply as any);
router.patch(`${ME_FORUMS_API}/:id/comments/:id/replies/:id/like`, likeForumReply as any);
router.patch(`${ME_FORUMS_API}/:id/comments/:id/replies/:id/unlike`, unlikeForumReply as any);

// Notes (not yet implemented in v2)
// router.get(`${BASE_API}/me/notes`, getNotes as any);
// router.post(`${BASE_API}/me/notes`, postNote as any);
// router.get(`${BASE_API}/me/notes/:id`, getNoteById as any);
// router.put(`${BASE_API}/me/notes/:id`, updateNote as any);
// router.delete(`${BASE_API}/me/notes/:id`, deleteNote as any);

// Exercises (not yet implemented in v2)
// router.get(`${BASE_API}/me/exercises/dashboard`, getExerciseDashboard as any);
// router.get(`${BASE_API}/me/exercises/history`, getExerciseHistory as any);
// router.get(`${BASE_API}/me/exercises/:id/report`, getExerciseReport as any);
// router.post(`${BASE_API}/me/exercises/:id/submit`, submitExercise as any);

// AI
const ME_AI_API = `${ME_API}/ai`;
const ME_AI_GENERAL_API = `${ME_AI_API}/general`;
const ME_AI_TOPICS_API = `${ME_AI_API}/topics`;
router.get(`${ME_AI_GENERAL_API}/tabs`, getAllAiGeneralTabs as any);
router.post(`${ME_AI_GENERAL_API}/tabs`, createAiGeneralTab as any);
router.get(`${ME_AI_GENERAL_API}/tabs/:id`, getAiGeneralTabHistory as any);
router.post(`${ME_AI_GENERAL_API}/tabs/:id`, callAiGeneral as any);
router.put(`${ME_AI_GENERAL_API}/tabs/:id`, updateAiGeneralTab as any);
router.delete(`${ME_AI_GENERAL_API}/tabs/:id`, deleteAiGeneralTab as any);
router.post(`${ME_AI_GENERAL_API}/rating/:id`, rateAiGeneralResponse as any);
router.get(`${ME_AI_TOPICS_API}`, getAllAiTopics as any);
router.get(`${ME_AI_TOPICS_API}/:id`, getAiTopicHistory as any);
router.post(`${ME_AI_TOPICS_API}/:id`, callAiTopic as any);
router.delete(`${ME_AI_TOPICS_API}/:id`, deleteAiTopic as any);
router.post(`${ME_AI_TOPICS_API}/rating/:id`, rateAiTopicResponse as any);

export default router;
