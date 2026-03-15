import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videoCommentLike, videoCommentMedias, videoComments, videoReplies, videoReplyMedias } from "@/db/drizzle/schema.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redis.js";
import { deleteReplyInternal } from "./replies/[id]/delete.js";

export const deleteVideoComment = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const userId = req.user.userId;
		const { id } = req.params;

		const doesUserOwnThisComment = await db
			.select()
			.from(videoComments)
			.where(
				and(
					eq(videoComments.id, Number(id)),
					eq(videoComments.userId, Number(userId))
				)
			)
			.limit(1);

		if (doesUserOwnThisComment.length === 0) {
			throw new ResponseError("Comment not found", 404);
		}

		const doesThisCommentHasReply = await db
			.select()
			.from(videoReplies)
			.where(eq(videoReplies.videoCommentId, Number(id)));
		let replyResults = null;
		if (doesThisCommentHasReply.length > 0) {
			replyResults = await deleteReplyInternal(
				Number(userId),
				null,
				Number(id),
				undefined
			);
		}
		const commentResults = await deleteVideoCommentInternal(
			Number(userId),
			Number(id),
			null,
			undefined
		);

		return res.status(200).json({
			data: {
				success: true,
				message: "Comment deleted successfully",
				commentResults,
			},
		});
	} catch (error) {
		return sendResponseError(res, error);
	}
};

export const deleteComment = async (
	userId: number,
	commentId: number | null,
	videoId: number | null,
	tx?: typeof db
) => {
	return await deleteVideoCommentInternal(userId, commentId, videoId, tx);
};

export const deleteVideoCommentInternal = async (userId: number, commentId: number | null, videoId: number | null, tx?: typeof db) => {
	const client = tx ?? db;
	try {
		if (commentId === null && videoId === null) {
			throw new ResponseError("Either commentId or videoId must be provided", 400);
		}

		// Delete by commentId
		if (commentId && videoId === null) {
			const doesThisCommentHasReply = await client
				.select()
				.from(videoReplies)
				.where(eq(videoReplies.videoCommentId, Number(commentId)))
				.limit(1);

			let deleteReply = null;
			if (doesThisCommentHasReply.length > 0) {
				deleteReply = await deleteReplyInternal(
					Number(userId),
					null,
					Number(commentId),
					client
				);
			}

			const mediaToDelete = await client
				.select({ urlForDeletion: videoCommentMedias.urlForDeletion })
				.from(videoCommentMedias)
				.where(eq(videoCommentMedias.videoCommentId, commentId));

			for (const media of mediaToDelete) {
				await deleteFromCloudflare("komplex-image", media.urlForDeletion ?? "");
			}

			const deletedMedia = await client
				.delete(videoCommentMedias)
				.where(eq(videoCommentMedias.videoCommentId, commentId))
				.returning({
					url: videoCommentMedias.url,
					mediaType: videoCommentMedias.mediaType,
				});

			const deletedLikes = await client
				.delete(videoCommentLike)
				.where(eq(videoCommentLike.videoCommentId, commentId))
				.returning();

			const deletedComment = await client
				.delete(videoComments)
				.where(and(eq(videoComments.id, commentId), eq(videoComments.userId, userId)))
				.returning();

			const pattern = `videoComments:video:${deletedComment[0].videoId}:page:*`;
			let cursor = "0";

			do {
				const scanResult = await redis.scan(cursor, {
					MATCH: pattern,
					COUNT: 100,
				});
				cursor = scanResult.cursor;
				const keys = scanResult.keys;

				if (keys.length > 0) {
					await Promise.all(keys.map((k) => redis.del(k)));
				}
			} while (cursor !== "0");

			await redis.del(`videoComments:video:${deletedComment[0].videoId}:lastPage`);

			return { deletedComment, deletedMedia, deletedLikes, deleteReply };
		}

		// Delete all comments for a videoId
		if (videoId && commentId === null) {
			const getCommentIdsByVideoId = await client
				.select({ id: videoComments.id })
				.from(videoComments)
				.where(eq(videoComments.videoId, videoId));
			const commentIds = getCommentIdsByVideoId.map((c) => c.id);

			for (const cId of commentIds) {
				await deleteReplyInternal(Number(userId), null, cId, client);
			}

			const mediaToDelete = await client
				.select({ urlForDeletion: videoCommentMedias.urlForDeletion })
				.from(videoCommentMedias)
				.where(
					commentIds.length > 0
						? inArray(videoCommentMedias.videoCommentId, commentIds)
						: eq(videoCommentMedias.videoCommentId, -1)
				);

			for (const media of mediaToDelete) {
				await deleteFromCloudflare("komplex-image", media.urlForDeletion ?? "");
			}

			const deletedMedia = await client
				.delete(videoCommentMedias)
				.where(
					commentIds.length > 0
						? inArray(videoCommentMedias.videoCommentId, commentIds)
						: eq(videoCommentMedias.videoCommentId, -1)
				)
				.returning({
					url: videoCommentMedias.url,
					mediaType: videoCommentMedias.mediaType,
				});

			const deletedLikes = await client
				.delete(videoCommentLike)
				.where(
					commentIds.length > 0
						? inArray(videoCommentLike.videoCommentId, commentIds)
						: eq(videoCommentLike.videoCommentId, -1)
				)
				.returning();

			const deletedComment = await client
				.delete(videoComments)
				.where(commentIds.length > 0 ? inArray(videoComments.id, commentIds) : eq(videoComments.id, -1))
				.returning();

			const pattern = `videoComments:video:${deletedComment[0].videoId}:page:*`;
			let cursor = "0";

			do {
				const scanResult = await redis.scan(cursor, {
					MATCH: pattern,
					COUNT: 100,
				});
				cursor = scanResult.cursor;
				const keys = scanResult.keys;

				if (keys.length > 0) {
					await Promise.all(keys.map((k) => redis.del(k)));
				}
			} while (cursor !== "0");

			await redis.del(`videoComments:video:${deletedComment[0].videoId}:lastPage`);

			return { deletedComment, deletedMedia, deletedLikes };
		}
	} catch (error) {
		throw new ResponseError(error as string, 500);
	}
};
