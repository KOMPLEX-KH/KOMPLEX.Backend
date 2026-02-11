import Router from "express";
import {
    verifyFirebaseToken,
    verifyFirebaseTokenAdmin,
    verifyFirebaseTokenOptional,
} from "@/middleware/auth.js";
import {
    getVideoRateLimiter,
    getSmallContentRateLimiter,
    getBigContentRateLimiter,
    searchRateLimiter,
    userLoginRateLimiter,
    userSignupRateLimiter,
    postVideoRateLimiter,
    followLimiter,
    postSmallRateLimiter,
    aiRateLimiter,
    adminLoginRateLimiter,
    adminGetVideoRateLimiter,
    adminGetSmallContentRateLimiter,
    adminGetBigContentRateLimiter,
    deleteVideoRateLimiter,
    updateSmallRateLimiter,
    updateVideoRateLimiter,
    postBigRateLimiter,
    deleteBigRateLimiter,
    deleteSmallRateLimiter,
    adminBigPostRateLimiter,
    adminSmallPostRateLimiter,
    adminVideoPostRateLimiter,
    adminBigUpdateRateLimiter,
    adminSmallUpdateRateLimiter,
    adminVideoUpdateRateLimiter,
    adminBigDeleteRateLimiter,
    adminSmallDeleteRateLimiter,
    adminVideoDeleteRateLimiter,
    updateBigRateLimiter,
} from "@/middleware/redisLimiter.js";

// ============================================================================
// Authentication Routes
// ============================================================================
import { postSignup } from "./api/komplex/auth/signup/post.js";
import { postSocialLogIn } from "./api/komplex/auth/social-login/post.js";

// ============================================================================
// Upload Routes
// ============================================================================
import { postUploadUrl } from "./api/komplex/upload-url/post.js";

// ============================================================================
// Feed Routes
// ============================================================================

// Videos
import { getAllVideos } from "./api/komplex/feed/videos/get.js";
import { getVideoById } from "./api/komplex/feed/videos/[id]/get.js";
import { getRecommendedVideos } from "./api/komplex/feed/videos/[id]/recommended/get.js";
import { getVideoLikes } from "./api/komplex/feed/videos/[id]/likes/get.js";
import { getVideoComments } from "./api/komplex/feed/videos/[id]/comments/get.js";
import { getVideoReplies } from "./api/komplex/feed/videos/[id]/comments/[id]/replies/get.js";

// Forums
import { getAllForums as getAllFeedForums } from "./api/komplex/feed/forums/get.js";
import { getForumById } from "./api/komplex/feed/forums/[id]/get.js";
import { getForumComments } from "./api/komplex/feed/forums/[id]/comments/get.js";
import { getForumReplies } from "./api/komplex/feed/forums/[id]/comments/[id]/replies/get.js";

// News
import { getAllNews } from "./api/komplex/feed/news/get.js";
import { getNewsById } from "./api/komplex/feed/news/[id]/get.js";

// Exercises
import { getExercises } from "./api/komplex/feed/exercises/get.js";
import { getExerciseById } from "./api/komplex/feed/exercises/[id]/get.js";

// Curriculums
import { getCurriculums } from "./api/komplex/feed/curriculums/get.js";
import { getCurriculumTopic } from "./api/komplex/feed/curriculums/[id]/get.js";

// Library
import {
    getAllBooks as getFeedBooks,
} from "./api/komplex/feed/librarys/get.js";
import { getBookById as getFeedBookById } from "./api/komplex/feed/librarys/[id]/get.js";
import { getBooksByLesson } from "./api/komplex/feed/librarys/lesson/[lessonId]/get.js";
import { getBooksBySubject } from "./api/komplex/feed/librarys/subject/[subjectId]/get.js";
import { filterBooks } from "./api/komplex/feed/librarys/filter/post.js";

// ============================================================================
// Search Routes
// ============================================================================
import { searchVideos } from "./api/komplex/search/videos/get.js";
import { searchForums } from "./api/komplex/search/forums/get.js";
import { searchNews } from "./api/komplex/search/news/get.js";

// ============================================================================
// Users Routes
// ============================================================================
import { getUserProfile } from "./api/komplex/users/[id]/profile/get.js";
import { getUserVideos } from "./api/komplex/users/[id]/videos/get.js";
import { getUserForums } from "./api/komplex/users/[id]/forums/get.js";

// ============================================================================
// Me Routes
// ============================================================================

// Profile
import { getMe } from "./api/komplex/me/get.js";
import { getMeProfile } from "./api/komplex/me/profile/get.js";
import { getMeDashboard } from "./api/komplex/me/dashboard/get.js";
import { getLastAccessed } from "./api/komplex/me/last-accessed/get.js";
import { getMyVideoHistory } from "./api/komplex/me/video-history/get.js";
import { postFeedback } from "./api/komplex/me/feedback/post.js";

// Follow
import { getFollowers } from "./api/komplex/me/follow/followers/get.js";
import { getFollowing } from "./api/komplex/me/follow/following/get.js";
import { followUser } from "./api/komplex/me/follow/follow/[id]/post.js";
import { unfollowUser } from "./api/komplex/me/follow/unfollow/[id]/post.js";

// Videos
import { getAllMyVideos } from "./api/komplex/me/videos/get.js";
import { postVideo } from "./api/komplex/me/videos/post.js";
import { updateVideo } from "./api/komplex/me/videos/[id]/put.js";
import { deleteVideo } from "./api/komplex/me/videos/[id]/delete.js";
import { likeVideo } from "./api/komplex/me/videos/[id]/like/patch.js";
import { unlikeVideo } from "./api/komplex/me/videos/[id]/unlike/patch.js";
import { postVideoComment } from "./api/komplex/me/videos/[id]/comments/post.js";
import { updateVideoComment } from "./api/komplex/me/videos/[id]/comments/[id]/put.js";
import { deleteVideoComment } from "./api/komplex/me/videos/[id]/comments/[id]/delete.js";
import { likeVideoComment } from "./api/komplex/me/videos/[id]/comments/[id]/like/patch.js";
import { unlikeVideoComment } from "./api/komplex/me/videos/[id]/comments/[id]/unlike/patch.js";
import { postVideoReply } from "./api/komplex/me/videos/[id]/comments/[id]/replies/post.js";
import { updateVideoReply } from "./api/komplex/me/videos/[id]/comments/[id]/replies/[id]/put.js";
import { deleteVideoReply } from "./api/komplex/me/videos/[id]/comments/[id]/replies/[id]/delete.js";
import { likeVideoReply } from "./api/komplex/me/videos/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeVideoReply } from "./api/komplex/me/videos/[id]/comments/[id]/replies/[id]/unlike/patch.js";

// Forums
import { getAllForums as getAllMyForums } from "./api/komplex/me/forums/get.js";
import { postForum } from "./api/komplex/me/forums/post.js";
import { updateForum } from "./api/komplex/me/forums/[id]/put.js";
import { deleteForum } from "./api/komplex/me/forums/[id]/delete.js";
import { likeForum } from "./api/komplex/me/forums/[id]/like/patch.js";
import { unlikeForum } from "./api/komplex/me/forums/[id]/unlike/patch.js";
import { postForumComment } from "./api/komplex/me/forums/[id]/comments/post.js";
import { updateForumComment } from "./api/komplex/me/forums/[id]/comments/[id]/put.js";
import { deleteForumComment } from "./api/komplex/me/forums/[id]/comments/[id]/delete.js";
import { likeForumComment } from "./api/komplex/me/forums/[id]/comments/[id]/like/patch.js";
import { unlikeForumComment } from "./api/komplex/me/forums/[id]/comments/[id]/unlike/patch.js";
import { postForumReply } from "./api/komplex/me/forums/[id]/comments/[id]/replies/post.js";
import { updateForumReply } from "./api/komplex/me/forums/[id]/comments/[id]/replies/[id]/put.js";
import { deleteForumReply } from "./api/komplex/me/forums/[id]/comments/[id]/replies/[id]/delete.js";
import { likeForumReply } from "./api/komplex/me/forums/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeForumReply } from "./api/komplex/me/forums/[id]/comments/[id]/replies/[id]/unlike/patch.js";

// Notes (not yet implemented in v2)
import { getMyNotes } from "./api/komplex/me/notes/get.js";
import { createMyNote } from "./api/komplex/me/notes/post.js";
import { getMyNoteById } from "./api/komplex/me/notes/[id]/get.js";
import { updateMyNote } from "./api/komplex/me/notes/[id]/put.js";
import { deleteMyNote } from "./api/komplex/me/notes/[id]/delete.js";

// Exercises (not yet implemented in v2)
// import { getExerciseDashboard } from "./api/v2/komplex/me/exercises/dashboard/get.js";
// import { getExerciseHistory } from "./api/v2/komplex/me/exercises/history/get.js";
// import { getExerciseReport } from "./api/v2/komplex/me/exercises/[id]/report/get.js";
// import { submitExercise } from "./api/v2/komplex/me/exercises/[id]/submit/post.js";

// AI
import { getAllAiGeneralTabs } from "./api/komplex/me/ai/general/tabs/get.js";
import { createAiGeneralTab } from "./api/komplex/me/ai/general/tabs/post.js";
import { getAiGeneralTabHistory } from "./api/komplex/me/ai/general/tabs/[id]/get.js";
import { callAiGeneral } from "./api/komplex/me/ai/general/tabs/[id]/post.js";
import { updateAiGeneralTab } from "./api/komplex/me/ai/general/tabs/[id]/put.js";
import { deleteAiGeneralTab } from "./api/komplex/me/ai/general/tabs/[id]/delete.js";
import { rateAiGeneralResponse } from "./api/komplex/me/ai/general/rating/[id]/post.js";
import { getAllAiTopics } from "./api/komplex/me/ai/topics/get.js";
import { getAiTopicHistory } from "./api/komplex/me/ai/topics/[id]/get.js";
import { callAiTopic } from "./api/komplex/me/ai/topics/[id]/post.js";
import { deleteAiTopic } from "./api/komplex/me/ai/topics/[id]/delete.js";
import { rateAiTopicResponse } from "./api/komplex/me/ai/topics/rating/[id]/post.js";

// ============================================================================
// Admin Routes
// ============================================================================

// Auth
import { login } from "./api/komplex-admin/auth/login/post.js";

// Dashboard
import { getDashboard } from "./api/komplex-admin/dashboard/get.js";

// Videos
import { getAllVideos as getAllAdminVideos } from "./api/komplex-admin/videos/get.js";
import { getVideoById as getAdminVideoById } from "./api/komplex-admin/videos/[id]/get.js";

// Grades & Subjects
import { getGrades as getAdminGrades } from "./api/komplex-admin/grades/get.js";
import { getSubjects as getAdminSubjects } from "./api/komplex-admin/subjects/get.js";

// Users
import { getAllUsers } from "./api/komplex-admin/users/get.js";
import { getAllAdmins } from "./api/komplex-admin/users/admins/get.js";
import { createAdmin } from "./api/komplex-admin/users/admins/post.js";
import { updateAdmin } from "./api/komplex-admin/users/admins/[id]/put.js";
import { deleteAdmin } from "./api/komplex-admin/users/admins/[id]/delete.js";

// Forums
import { getAllForums as getAllAdminForums } from "./api/komplex-admin/forums/get.js";
import { getForumById as getAdminForumById } from "./api/komplex-admin/forums/[id]/get.js";
import { updateForum as updateAdminForum } from "./api/komplex-admin/forums/[id]/put.js";
import { deleteForum as deleteAdminForum } from "./api/komplex-admin/forums/[id]/delete.js";

// News
import { postNews } from "./api/komplex-admin/news/post.js";
import { updateNews } from "./api/komplex-admin/news/[id]/put.js";
import { deleteNews } from "./api/komplex-admin/news/[id]/delete.js";

// Exercises
import { getExercises as getAdminExercises } from "./api/komplex-admin/exercises/get.js";
import { createExercise } from "./api/komplex-admin/exercises/post.js";
import { getExercise as getAdminExercise } from "./api/komplex-admin/exercises/[id]/get.js";
import { updateExercise } from "./api/komplex-admin/exercises/[id]/put.js";
import { deleteExercise } from "./api/komplex-admin/exercises/[id]/delete.js";
import { getExerciseDashboard } from "./api/komplex-admin/exercises/dashboard/get.js";

// Feedbacks
import { getFeedbacks } from "./api/komplex-admin/feedbacks/get.js";
import { updateFeedbackStatus } from "./api/komplex-admin/feedbacks/[id]/patch.js";

// Forum Comments
import { getAllCommentsForAForum as getAllAdminCommentsForAForum } from "./api/komplex-admin/forum_comments/[id]/get.js";
import { postForumComment as postAdminForumComment } from "./api/komplex-admin/forum_comments/[id]/post.js";
import { updateForumComment as updateAdminForumComment } from "./api/komplex-admin/forum_comments/[id]/patch.js";
import { likeForumComment as likeAdminForumComment } from "./api/komplex-admin/forum_comments/[id]/like/post.js";
import { unlikeForumComment as unlikeAdminForumComment } from "./api/komplex-admin/forum_comments/[id]/unlike/delete.js";

// Forum Replies
import { getAllRepliesForAComment as getAllAdminRepliesForAComment } from "./api/komplex-admin/forum_replies/[id]/get.js";
import { postForumReply as postAdminForumReply } from "./api/komplex-admin/forum_replies/[id]/post.js";
import { updateForumReply as updateAdminForumReply } from "./api/komplex-admin/forum_replies/[id]/patch.js";
import { likeForumReply as likeAdminForumReply } from "./api/komplex-admin/forum_replies/[id]/like/post.js";
import { unlikeForumReply as unlikeAdminForumReply } from "./api/komplex-admin/forum_replies/[id]/unlike/delete.js";

// AI
import { getAiDashboard as getAdminAiDashboard } from "./api/komplex-admin/ai/dashboard/get.js";
import { getGeneralAiDashboard as getAdminGeneralAiDashboard } from "./api/komplex-admin/ai/general/dashboard/get.js";
import { getGeneralAiResponses as getAdminGeneralAiResponses } from "./api/komplex-admin/ai/general/get.js";
import { getGeneralAiResponseById as getAdminGeneralAiResponseById } from "./api/komplex-admin/ai/general/responses/[id]/get.js";
import { getTopicAiDashboard as getAdminTopicAiDashboard } from "./api/komplex-admin/ai/topics/dashboard/get.js";
import { getTopicAiResponses as getAdminTopicAiResponses } from "./api/komplex-admin/ai/topics/get.js";
import { getTopicAiResponseById as getAdminTopicAiResponseById } from "./api/komplex-admin/ai/topics/responses/[id]/get.js";

// Curriculums
import { getCurriculumsDashboard as getAdminCurriculumsDashboard } from "./api/komplex-admin/curriculums/dashboard/get.js";
import { createGrade as createAdminGrade } from "./api/komplex-admin/curriculums/grades/post.js";
import { updateGrade as updateAdminGrade } from "./api/komplex-admin/curriculums/grades/[id]/patch.js";
import { deleteGrade as deleteAdminGrade } from "./api/komplex-admin/curriculums/grades/[id]/delete.js";
import { createSubject as createAdminSubject } from "./api/komplex-admin/curriculums/subjects/post.js";
import { updateSubject as updateAdminSubject } from "./api/komplex-admin/curriculums/subjects/[id]/patch.js";
import { deleteSubject as deleteAdminSubject } from "./api/komplex-admin/curriculums/subjects/[id]/delete.js";
import { createLesson as createAdminLesson } from "./api/komplex-admin/curriculums/lessons/post.js";
import { updateLesson as updateAdminLesson } from "./api/komplex-admin/curriculums/lessons/[id]/patch.js";
import { deleteLesson as deleteAdminLesson } from "./api/komplex-admin/curriculums/lessons/[id]/delete.js";
import { createTopic as createAdminTopic } from "./api/komplex-admin/curriculums/topics/post.js";
import { updateTopicComponent as updateAdminTopicComponent } from "./api/komplex-admin/curriculums/topics/[id]/put.js";
import { updateTopic as updateAdminTopic } from "./api/komplex-admin/curriculums/topics/[id]/patch.js";
import { deleteTopic as deleteAdminTopic } from "./api/komplex-admin/curriculums/topics/[id]/delete.js";

// Database
import { getDatabaseDashboard } from "./api/komplex-admin/database/dashboard/get.js";
import { getSchemaData as getAdminSchemaData } from "./api/komplex-admin/database/schema/get.js";
import { getUsers as getAdminDatabaseUsers } from "./api/komplex-admin/database/users/get.js";
import { createUser as createAdminDatabaseUser } from "./api/komplex-admin/database/users/post.js";
import { updateUser as updateAdminDatabaseUser } from "./api/komplex-admin/database/users/[username]/put.js";
import { deleteUser as deleteAdminDatabaseUser } from "./api/komplex-admin/database/users/[username]/delete.js";
import { getRoles as getAdminDatabaseRoles } from "./api/komplex-admin/database/roles/get.js";
import { createRole as createAdminDatabaseRole } from "./api/komplex-admin/database/roles/post.js";
import { updateRoleName as updateAdminDatabaseRoleName } from "./api/komplex-admin/database/roles/[rolename]/put.js";
import { deleteRole as deleteAdminDatabaseRole } from "./api/komplex-admin/database/roles/[rolename]/delete.js";
import { updateRolePrivileges as updateAdminDatabaseRolePrivileges } from "./api/komplex-admin/database/roles/[rolename]/privileges/put.js";
import { updateRoleTableAccess as updateAdminDatabaseRoleTableAccess } from "./api/komplex-admin/database/roles/[rolename]/tables/put.js";
import { getPrivileges as getAdminDatabasePrivileges } from "./api/komplex-admin/database/privileges/get.js";
import { getTables as getAdminDatabaseTables } from "./api/komplex-admin/database/tables/get.js";
import { executeConsoleCommand as executeAdminDatabaseConsole } from "./api/komplex-admin/database/console/post.js";

// Library
import { getAllBooks as getAdminAllBooks } from "./api/komplex-admin/library/books/get.js";
import { createBook as createAdminBook } from "./api/komplex-admin/library/books/post.js";
import { getBookById as getAdminBookById } from "./api/komplex-admin/library/books/[id]/get.js";
import { updateBook as updateAdminBook } from "./api/komplex-admin/library/books/[id]/put.js";
import { deleteBook as deleteAdminBook } from "./api/komplex-admin/library/books/[id]/delete.js";

// Upload
import { uploadFile as uploadAdminFile } from "./api/komplex-admin/upload/file/post.js";

const BASE_API = "/api/komplex";
const ADMIN_BASE_API = "/api/komplex-admin";
const router = Router();

// ============================================================================
// Authentication Routes
// ============================================================================
router.post(
    `${BASE_API}/auth/signup`,
    userSignupRateLimiter,
    postSignup as any
);
router.post(
    `${BASE_API}/auth/social-login`,
    userLoginRateLimiter,
    postSocialLogIn as any
);

// ============================================================================
// Upload Routes
// ============================================================================
router.post(
    `${BASE_API}/upload/upload-url`,
    verifyFirebaseTokenAdmin as any,
    postVideoRateLimiter,
    postUploadUrl as any
);

// ============================================================================
// Feed Routes
// ============================================================================
const FEED_API = `${BASE_API}/feed`;

// Videos
const VIDEO_FEED_API = `${FEED_API}/videos`;
router.get(
    `${VIDEO_FEED_API}`,
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getAllVideos as any
);
router.get(
    `${VIDEO_FEED_API}/:id`,
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getVideoById as any
);
router.get(
    `${VIDEO_FEED_API}/:id/recommended`,
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getRecommendedVideos as any
);
router.get(`${VIDEO_FEED_API}/:id/likes`, getVideoLikes as any);
router.get(`${VIDEO_FEED_API}/:id/comments`, getVideoComments as any);
router.get(`${VIDEO_FEED_API}/:id/comments/:id/replies`, getVideoReplies as any);

// Forums
const FORUM_FEED_API = `${FEED_API}/forums`;
router.get(
    `${FORUM_FEED_API}`,
    verifyFirebaseTokenOptional as any,
    getBigContentRateLimiter,
    getAllFeedForums as any
);
router.get(
    `${FORUM_FEED_API}/:id`,
    verifyFirebaseTokenOptional as any,
    getBigContentRateLimiter,
    getForumById as any
);
router.get(`${FORUM_FEED_API}/:id/comments`, getForumComments as any);
router.get(`${FORUM_FEED_API}/:id/comments/:id/replies`, getForumReplies as any);

// News
const NEWS_FEED_API = `${FEED_API}/news`;
router.get(
    `${NEWS_FEED_API}`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getAllNews as any
);
router.get(
    `${NEWS_FEED_API}/:id`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getNewsById as any
);

// Exercises
const EXERCISES_FEED_API = `${FEED_API}/exercises`;
router.get(
    `${EXERCISES_FEED_API}`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getExercises as any
);
router.get(
    `${EXERCISES_FEED_API}/:id`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getExerciseById as any
);

// Curriculums
const CURRICULUMS_FEED_API = `${FEED_API}/curriculums`;
router.get(
    `${CURRICULUMS_FEED_API}`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getCurriculums as any
);
router.get(
    `${CURRICULUMS_FEED_API}/:id`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getCurriculumTopic as any
);

// Library
const LIBRARY_FEED_API = `${FEED_API}/librarys`;
router.get(`${LIBRARY_FEED_API}`, verifyFirebaseTokenOptional as any, getFeedBooks as any);
router.get(`${LIBRARY_FEED_API}/lesson/:lessonId`, verifyFirebaseTokenOptional as any, getBooksByLesson as any);
router.get(`${LIBRARY_FEED_API}/subject/:subjectId`, verifyFirebaseTokenOptional as any, getBooksBySubject as any);
router.get(`${LIBRARY_FEED_API}/:id`, verifyFirebaseTokenOptional as any, getFeedBookById as any);
router.post(`${LIBRARY_FEED_API}/filter`, verifyFirebaseTokenOptional as any, filterBooks as any);

// ============================================================================
// Search Routes
// ============================================================================
const SEARCH_API = `${BASE_API}/search`;
router.get(
    `${SEARCH_API}/videos`,
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchVideos as any
);
router.get(
    `${SEARCH_API}/forums`,
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchForums as any
);
router.get(
    `${SEARCH_API}/news`,
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchNews as any
);

// ============================================================================
// Users Routes
// ============================================================================
const USERS_API = `${BASE_API}/users`;
router.get(
    `${USERS_API}/:id/profile`,
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getUserProfile as any
);
router.get(
    `${USERS_API}/:id/videos`,
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getUserVideos as any
);
router.get(
    `${USERS_API}/:id/forums`,
    verifyFirebaseTokenOptional as any,
    getBigContentRateLimiter,
    getUserForums as any
);

// ============================================================================
// Me Routes
// ============================================================================
const ME_API = `${BASE_API}/me`;

// Profile
router.get(`${ME_API}`, verifyFirebaseToken as any, getMe as any);
router.get(`${ME_API}/profile`, verifyFirebaseToken as any, getMeProfile as any);
router.get(
    `${ME_API}/dashboard`,
    verifyFirebaseToken as any,
    getMeDashboard as any
);
router.get(
    `${ME_API}/last-accessed`,
    verifyFirebaseToken as any,
    getLastAccessed as any
);
router.get(
    `${ME_API}/video-history`,
    verifyFirebaseToken as any,
    getMyVideoHistory as any
);
router.post(
    `${ME_API}/feedback`,
    verifyFirebaseToken as any,
    postSmallRateLimiter,
    postFeedback as any
);

// Follow
const FOLLOW_API = `${ME_API}/follow`;
router.get(
    `${FOLLOW_API}/followers`,
    verifyFirebaseToken as any,
    followLimiter,
    getFollowers as any
);
router.get(
    `${FOLLOW_API}/following`,
    verifyFirebaseToken as any,
    followLimiter,
    getFollowing as any
);
router.post(
    `${FOLLOW_API}/follow/:id`,
    verifyFirebaseToken as any,
    followLimiter,
    followUser as any
);
router.post(
    `${FOLLOW_API}/unfollow/:id`,
    verifyFirebaseToken as any,
    followLimiter,
    unfollowUser as any
);

// Videos
const ME_VIDEOS_API = `${ME_API}/videos`;
router.get(
    `${ME_VIDEOS_API}`,
    verifyFirebaseToken as any,
    getVideoRateLimiter,
    getAllMyVideos as any
);
router.post(
    `${ME_VIDEOS_API}`,
    verifyFirebaseToken as any,
    postVideoRateLimiter,
    postVideo as any
);
router.put(
    `${ME_VIDEOS_API}/:id`,
    verifyFirebaseToken as any,
    updateVideoRateLimiter,
    updateVideo as any
);
router.delete(
    `${ME_VIDEOS_API}/:id`,
    verifyFirebaseToken as any,
    deleteVideoRateLimiter,
    deleteVideo as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideo as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideo as any
);
router.post(
    `${ME_VIDEOS_API}/:id/comments`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoComment as any
);
router.put(
    `${ME_VIDEOS_API}/:id/comments/:id`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    updateVideoComment as any
);
router.delete(
    `${ME_VIDEOS_API}/:id/comments/:id`,
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoComment as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/comments/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoComment as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/comments/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoComment as any
);
router.post(
    `${ME_VIDEOS_API}/:id/comments/:id/replies`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoReply as any
);
router.put(
    `${ME_VIDEOS_API}/:id/comments/:id/replies/:id`,
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateVideoReply as any
);
router.delete(
    `${ME_VIDEOS_API}/:id/comments/:id/replies/:id`,
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoReply as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/comments/:id/replies/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoReply as any
);
router.patch(
    `${ME_VIDEOS_API}/:id/comments/:id/replies/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoReply as any
);

// Forums
const ME_FORUMS_API = `${ME_API}/forums`;
router.get(
    `${ME_FORUMS_API}`,
    verifyFirebaseToken as any,
    getBigContentRateLimiter,
    getAllMyForums as any
);
router.post(
    `${ME_FORUMS_API}`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForum as any
);
router.put(
    `${ME_FORUMS_API}/:id`,
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForum as any
);
router.delete(
    `${ME_FORUMS_API}/:id`,
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForum as any
);
router.patch(
    `${ME_FORUMS_API}/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForum as any
);
router.patch(
    `${ME_FORUMS_API}/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForum as any
);
router.post(
    `${ME_FORUMS_API}/:id/comments`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumComment as any
);
router.put(
    `${ME_FORUMS_API}/:id/comments/:id`,
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumComment as any
);
router.delete(
    `${ME_FORUMS_API}/:id/comments/:id`,
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumComment as any
);
router.patch(
    `${ME_FORUMS_API}/:id/comments/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumComment as any
);
router.patch(
    `${ME_FORUMS_API}/:id/comments/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumComment as any
);
router.post(
    `${ME_FORUMS_API}/:id/comments/:id/replies`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumReply as any
);
router.put(
    `${ME_FORUMS_API}/:id/comments/:id/replies/:id`,
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumReply as any
);
router.delete(
    `${ME_FORUMS_API}/:id/comments/:id/replies/:id`,
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumReply as any
);
router.patch(
    `${ME_FORUMS_API}/:id/comments/:id/replies/:id/like`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumReply as any
);
router.patch(
    `${ME_FORUMS_API}/:id/comments/:id/replies/:id/unlike`,
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumReply as any
);

// Notes
const ME_NOTES_API = `${ME_API}/notes`;
router.get(
    `${ME_NOTES_API}`,
    verifyFirebaseToken as any,
    getSmallContentRateLimiter,
    getMyNotes as any
);
router.post(
    `${ME_NOTES_API}`,
    verifyFirebaseToken as any,
    getBigContentRateLimiter,
    createMyNote as any
);
router.get(
    `${ME_NOTES_API}/:id`,
    verifyFirebaseToken as any,
    getSmallContentRateLimiter,
    getMyNoteById as any
);
router.put(
    `${ME_NOTES_API}/:id`,
    verifyFirebaseToken as any,
    postBigRateLimiter,
    updateMyNote as any
);
router.delete(
    `${ME_NOTES_API}/:id`,
    verifyFirebaseToken as any,
    deleteSmallRateLimiter,
    deleteMyNote as any
);

// Exercises (not yet implemented in v2)
// router.get(`${BASE_API}/me/exercises/dashboard`, getExerciseDashboard as any);
// router.get(`${BASE_API}/me/exercises/history`, getExerciseHistory as any);
// router.get(`${BASE_API}/me/exercises/:id/report`, getExerciseReport as any);
// router.post(`${BASE_API}/me/exercises/:id/submit`, submitExercise as any);

// AI
const ME_AI_API = `${ME_API}/ai`;
const ME_AI_GENERAL_API = `${ME_AI_API}/general`;
const ME_AI_TOPICS_API = `${ME_AI_API}/topics`;
router.get(
    `${ME_AI_GENERAL_API}/tabs`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAllAiGeneralTabs as any
);
router.post(
    `${ME_AI_GENERAL_API}/tabs`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    createAiGeneralTab as any
);
router.get(
    `${ME_AI_GENERAL_API}/tabs/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAiGeneralTabHistory as any
);
router.post(
    `${ME_AI_GENERAL_API}/tabs/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    callAiGeneral as any
);
router.put(
    `${ME_AI_GENERAL_API}/tabs/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    updateAiGeneralTab as any
);
router.delete(
    `${ME_AI_GENERAL_API}/tabs/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    deleteAiGeneralTab as any
);
router.post(
    `${ME_AI_GENERAL_API}/rating/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    rateAiGeneralResponse as any
);
router.get(
    `${ME_AI_TOPICS_API}`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAllAiTopics as any
);
router.get(
    `${ME_AI_TOPICS_API}/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAiTopicHistory as any
);
router.post(
    `${ME_AI_TOPICS_API}/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    callAiTopic as any
);
router.delete(
    `${ME_AI_TOPICS_API}/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    deleteAiTopic as any
);
router.post(
    `${ME_AI_TOPICS_API}/rating/:id`,
    verifyFirebaseToken as any,
    aiRateLimiter,
    rateAiTopicResponse as any
);

// ============================================================================
// Admin Routes
// ============================================================================

// Auth
router.post(
    `${ADMIN_BASE_API}/auth/login`,
    adminLoginRateLimiter,
    login as any
);

// Dashboard
router.get(
    `${ADMIN_BASE_API}/dashboard`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getDashboard as any
);

// Videos
router.get(
    `${ADMIN_BASE_API}/videos`,
    verifyFirebaseTokenAdmin as any,
    adminGetVideoRateLimiter,
    getAllAdminVideos as any
);
router.get(
    `${ADMIN_BASE_API}/videos/:id`,
    verifyFirebaseTokenAdmin as any,
    adminGetVideoRateLimiter,
    getAdminVideoById as any
);

// Grades & Subjects
router.get(
    `${ADMIN_BASE_API}/grades`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminGrades as any
);
router.get(
    `${ADMIN_BASE_API}/subjects`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminSubjects as any
);

// Users
router.get(
    `${ADMIN_BASE_API}/users`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAllUsers as any
);
router.get(
    `${ADMIN_BASE_API}/users/admins`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAllAdmins as any
);
router.post(
    `${ADMIN_BASE_API}/users/admins`,
    verifyFirebaseTokenAdmin as any,
    createAdmin as any
);
router.put(
    `${ADMIN_BASE_API}/users/admins/:id`,
    verifyFirebaseTokenAdmin as any,
    updateAdmin as any
);
router.delete(
    `${ADMIN_BASE_API}/users/admins/:id`,
    verifyFirebaseTokenAdmin as any,
    deleteAdmin as any
);

// Forums
router.get(
    `${ADMIN_BASE_API}/forums`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAllAdminForums as any
);
router.get(
    `${ADMIN_BASE_API}/forums/:id`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminForumById as any
);
router.put(
    `${ADMIN_BASE_API}/forums/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigUpdateRateLimiter,
    updateAdminForum as any
);
router.delete(
    `${ADMIN_BASE_API}/forums/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigDeleteRateLimiter,
    deleteAdminForum as any
);

// News
router.post(
    `${ADMIN_BASE_API}/news`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    postNews as any
);
router.put(
    `${ADMIN_BASE_API}/news/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateNews as any
);
router.delete(
    `${ADMIN_BASE_API}/news/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteNews as any
);

// Exercises
router.get(
    `${ADMIN_BASE_API}/exercises`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercises as any
);
router.post(
    `${ADMIN_BASE_API}/exercises`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    createExercise as any
);
router.get(
    `${ADMIN_BASE_API}/exercises/:id`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercise as any
);
router.put(
    `${ADMIN_BASE_API}/exercises/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateExercise as any
);
router.delete(
    `${ADMIN_BASE_API}/exercises/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteExercise as any
);
router.get(
    `${ADMIN_BASE_API}/exercises/dashboard`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getExerciseDashboard as any
);

// Feedbacks
router.get(
    `${ADMIN_BASE_API}/feedbacks`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getFeedbacks as any
);
router.patch(
    `${ADMIN_BASE_API}/feedbacks/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateFeedbackStatus as any
);

// Forum Comments
router.get(
    `${ADMIN_BASE_API}/forum_comments/:id`,
    verifyFirebaseTokenAdmin as any,
    getAllAdminCommentsForAForum as any
);
router.post(
    `${ADMIN_BASE_API}/forum_comments/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigPostRateLimiter,
    postAdminForumComment as any
);
router.patch(
    `${ADMIN_BASE_API}/forum_comments/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigUpdateRateLimiter,
    updateAdminForumComment as any
);
router.post(
    `${ADMIN_BASE_API}/forum_comments/:id/like`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    likeAdminForumComment as any
);
router.delete(
    `${ADMIN_BASE_API}/forum_comments/:id/unlike`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    unlikeAdminForumComment as any
);

// Forum Replies
router.get(
    `${ADMIN_BASE_API}/forum_replies/:id`,
    verifyFirebaseTokenAdmin as any,
    getAllAdminRepliesForAComment as any
);
router.post(
    `${ADMIN_BASE_API}/forum_replies/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigPostRateLimiter,
    postAdminForumReply as any
);
router.patch(
    `${ADMIN_BASE_API}/forum_replies/:id`,
    verifyFirebaseTokenAdmin as any,
    adminBigUpdateRateLimiter,
    updateAdminForumReply as any
);
router.post(
    `${ADMIN_BASE_API}/forum_replies/:id/like`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    likeAdminForumReply as any
);
router.delete(
    `${ADMIN_BASE_API}/forum_replies/:id/unlike`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    unlikeAdminForumReply as any
);

// AI
router.get(`${ADMIN_BASE_API}/ai/dashboard`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminAiDashboard as any);
router.get(`${ADMIN_BASE_API}/ai/general/dashboard`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminGeneralAiDashboard as any);
router.get(`${ADMIN_BASE_API}/ai/general`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminGeneralAiResponses as any);
router.get(`${ADMIN_BASE_API}/ai/general/responses/:id`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminGeneralAiResponseById as any);
router.get(`${ADMIN_BASE_API}/ai/topics/dashboard`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminTopicAiDashboard as any);
router.get(`${ADMIN_BASE_API}/ai/topics`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminTopicAiResponses as any);
router.get(`${ADMIN_BASE_API}/ai/topics/responses/:id`, verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminTopicAiResponseById as any);

// Curriculums
router.get(
    `${ADMIN_BASE_API}/curriculums/dashboard`,
    verifyFirebaseTokenAdmin as any,
    getAdminCurriculumsDashboard as any
);
router.post(
    `${ADMIN_BASE_API}/curriculums/grades`,
    verifyFirebaseTokenAdmin as any,
    createAdminGrade as any
);
router.patch(
    `${ADMIN_BASE_API}/curriculums/grades/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminGrade as any
);
router.delete(
    `${ADMIN_BASE_API}/curriculums/grades/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminGrade as any
);
router.post(
    `${ADMIN_BASE_API}/curriculums/subjects`,
    verifyFirebaseTokenAdmin as any,
    createAdminSubject as any
);
router.patch(
    `${ADMIN_BASE_API}/curriculums/subjects/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminSubject as any
);
router.delete(
    `${ADMIN_BASE_API}/curriculums/subjects/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminSubject as any
);
router.post(
    `${ADMIN_BASE_API}/curriculums/lessons`,
    verifyFirebaseTokenAdmin as any,
    createAdminLesson as any
);
router.patch(
    `${ADMIN_BASE_API}/curriculums/lessons/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminLesson as any
);
router.delete(
    `${ADMIN_BASE_API}/curriculums/lessons/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminLesson as any
);
router.post(
    `${ADMIN_BASE_API}/curriculums/topics`,
    verifyFirebaseTokenAdmin as any,
    createAdminTopic as any
);
router.put(
    `${ADMIN_BASE_API}/curriculums/topics/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminTopicComponent as any
);
router.patch(
    `${ADMIN_BASE_API}/curriculums/topics/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminTopic as any
);
router.delete(
    `${ADMIN_BASE_API}/curriculums/topics/:id`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminTopic as any
);

// Database
router.get(
    `${ADMIN_BASE_API}/database/dashboard`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getDatabaseDashboard as any
);
router.get(
    `${ADMIN_BASE_API}/database/schema`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminSchemaData as any
);
router.get(
    `${ADMIN_BASE_API}/database/users`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabaseUsers as any
);
router.post(
    `${ADMIN_BASE_API}/database/users`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    createAdminDatabaseUser as any
);
router.put(
    `${ADMIN_BASE_API}/database/users/:username`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseUser as any
);
router.delete(
    `${ADMIN_BASE_API}/database/users/:username`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminDatabaseUser as any
);
router.get(
    `${ADMIN_BASE_API}/database/roles`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabaseRoles as any
);
router.post(
    `${ADMIN_BASE_API}/database/roles`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    createAdminDatabaseRole as any
);
router.put(
    `${ADMIN_BASE_API}/database/roles/:rolename`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRoleName as any
);
router.delete(
    `${ADMIN_BASE_API}/database/roles/:rolename`,
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminDatabaseRole as any
);
router.put(
    `${ADMIN_BASE_API}/database/roles/:rolename/privileges`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRolePrivileges as any
);
router.put(
    `${ADMIN_BASE_API}/database/roles/:rolename/tables`,
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRoleTableAccess as any
);
router.get(
    `${ADMIN_BASE_API}/database/privileges`,
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabasePrivileges as any
);
router.get(
    `${ADMIN_BASE_API}/database/tables`,
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminDatabaseTables as any
);
router.post(
    `${ADMIN_BASE_API}/database/console`,
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    executeAdminDatabaseConsole as any
);

// Library
router.get(
    `${ADMIN_BASE_API}/library/books`,
    verifyFirebaseTokenAdmin as any,
    getAdminAllBooks as any
);
router.post(
    `${ADMIN_BASE_API}/library/books`,
    verifyFirebaseTokenAdmin as any,
    createAdminBook as any
);
router.get(
    `${ADMIN_BASE_API}/library/books/:id`,
    verifyFirebaseTokenAdmin as any,
    getAdminBookById as any
);
router.put(
    `${ADMIN_BASE_API}/library/books/:id`,
    verifyFirebaseTokenAdmin as any,
    updateAdminBook as any
);
router.delete(
    `${ADMIN_BASE_API}/library/books/:id`,
    verifyFirebaseTokenAdmin as any,
    deleteAdminBook as any
);

// Upload
router.post(
    `${ADMIN_BASE_API}/upload/file`,
    verifyFirebaseTokenAdmin as any,
    uploadAdminFile as any
);

export default router;