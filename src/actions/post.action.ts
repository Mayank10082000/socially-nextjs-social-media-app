"use server";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";
import { prisma } from "@/lib/prisma";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    revalidatePath("/"); // This next js function is used to fetch the post in the home page after the post is posted by the user.
    return { success: true, post };
  } catch (error) {
    console.log("Error in createPost", error);
    return { success: false, message: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    // Check if the user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // Like and create notification (only liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  userId: post.authorId,
                  type: "LIKE",
                  creatorId: userId,
                  read: false,
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleLike", error);
    throw new Error("Failed to toggle like");
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;
    if (!content) throw new Error("Content is required");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // Create comment and notification in  a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create the comment
      const newComment = await tx.comment.create({
        data: {
          content,
          postId,
          authorId: userId,
        },
      });

      // Create notification if the post author is not the comment author
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: "COMMENT",
            creatorId: userId,
            read: false,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath("/");
    return { success: true, comment };
  } catch (error) {
    console.log("Error in createComment", error);
    throw new Error("Failed to create comment");
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (post.authorId !== userId) throw new Error("Unauthorized");

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // Purge the cache to update the UI immediately
    return { success: true };
  } catch (error) {
    console.log("Error in deletePost", error);
    throw new Error("Failed to delete post");
  }
}
