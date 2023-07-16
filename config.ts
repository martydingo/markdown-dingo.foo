// 1. Import your utilities and schemas
import { defineCollection } from 'astro:content';
import blogSchema from '../schemas/blogSchema';
import authorSchema from '../schemas/authorSchema';

// 2. Define your collections
const blogCollection = defineCollection({
  type: 'content',
  schema: blogSchema,
});
const authorCollection = defineCollection({
  type: 'data',
  schema: authorSchema,
});

// 3. Export multiple collections to register them
export const collections = {
  'blog': blogCollection,
  'authors': authorCollection,
};