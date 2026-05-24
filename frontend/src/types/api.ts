export type PostStatus = "Pending" | "Published" | "Hidden";

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
  authorName: string;
  viewCount: number;
  wordCount: number;
  reactionCount: number;
  commentCount: number;
  tags: string[];
}

export interface PostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  viewCount: number;
  tags: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  role: "Author" | "Admin";
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface TagResponse {
  id: string;
  slug: string;
  name: string;
  postCount: number;
}

export interface CreatePostRequest {
  title: string;
  slug?: string;
  excerpt?: string;
  contentMarkdown: string;
  coverImageUrl?: string | null;
  status: PostStatus;
  publishedAt?: string | null;
  tags?: string[];
}

export interface CommentResponse {
  id: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export type ReactionKind = "Like" | "Heart" | "Haha" | "Sad";

export interface ReactionsResponse {
  like: number;
  heart: number;
  haha: number;
  sad: number;
  total: number;
  mine: ReactionKind | null;
}

export interface UploadResponse {
  url: string;
  contentType: string;
  sizeBytes: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  role: "Author" | "Admin";
  isBanned: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

export interface AdminUserPostRow {
  id: string;
  slug: string;
  title: string;
  status: "Pending" | "Published" | "Hidden";
  publishedAt: string | null;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
}

export interface AdminUserCommentRow {
  id: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  content: string;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  displayName: string;
  role: "Author" | "Admin";
  isBanned: boolean;
  createdAt: string;
  acceptedRulesAt: string | null;
  publishedPostCount: number;
  hiddenPostCount: number;
  draftPostCount: number;
  commentCount: number;
  totalReactionsReceived: number;
  totalViewsReceived: number;
  reportsAgainstCount: number;
  posts: AdminUserPostRow[];
  comments: AdminUserCommentRow[];
}

export interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  admins: number;
  totalPosts: number;
  hiddenPosts: number;
  totalComments: number;
  totalReactions: number;
  openReports: number;
}

export type ReportReason = "Spam" | "Harassment" | "Illegal" | "Misinformation" | "Other";

export interface AdminReportItem {
  id: string;
  reporterName: string;
  reason: ReportReason;
  details: string;
  status: "Open" | "Resolved" | "Dismissed";
  createdAt: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  postAuthorName: string;
  postStatus: "Pending" | "Published" | "Hidden";
}

export interface AdminPostItem {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  authorId: string;
  status: "Pending" | "Published" | "Hidden";
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  coverImageUrl: string | null;
}
