import { useParams } from "react-router";
import { NotFound } from "@/components/layout/NotFound";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { ApiError } from "@/lib/problem";
import { PostForm } from "./PostForm";
import { usePost } from "./usePosts";

// Serves both /posts/new and /posts/:id
export function PostPage() {
  const { id } = useParams();
  const postId = id === undefined ? undefined : Number(id);
  const post = usePost(postId !== undefined && Number.isInteger(postId) ? postId : undefined);

  if (id === undefined) {
    return <PostForm key="new" post={null} />;
  }
  if (postId === undefined || !Number.isInteger(postId)) {
    return <NotFound />;
  }
  if (post.isPending) {
    return <Loading />;
  }
  if (post.isError) {
    return post.error instanceof ApiError && post.error.status === 404 ? (
      <NotFound />
    ) : (
      <LoadError onRetry={() => void post.refetch()} />
    );
  }
  return <PostForm key={post.data.id} post={post.data} />;
}
