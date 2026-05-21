export interface StoryImage {
  id: string;
  imageUrl: string;
  order: number;
}

export interface StoryAuthor {
  username: string;
  image: string | null;
}

export interface StoryWithRelations {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string;
  authorId: string;
  author: StoryAuthor;
  images: StoryImage[];
  likes: number;
  sharesCount: number;
  commentsCount: number;
  createdAt: string;
  remixOfId: string | null;
  _count: {
    reactions: number;
    comments: number;
    bookmarks: number;
    remixes: number;
  };
}
