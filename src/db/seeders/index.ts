import { postTags } from "post_tag";
import { posts } from "posts";
import { users } from "users";
import { tags as restoredTags } from '../../../tags';
import { writeFile } from "fs/promises";
import { Post } from "src/posts/entities/post.entity";
import { postsContainer, userContainer } from "src/scripts/db";
import { Role, User } from "src/users/entities/user.entity";
import * as bcrypt from 'bcrypt';
import { restored } from "restored";

async function restore() {
  const items = await Promise.all(posts.map(async (post) => {
    try {
      const user = users.find(u => u.id === post.userId);
      const tagIds = postTags.filter(pt => pt.postId === post.id).map(pt => pt.tagId);
      const tagsNames = restoredTags.filter(t => tagIds.includes(t.id)).map(t => t.name);
      const {
        title,
        slug,
        category,
        subCategory,
        readingTime,
        description,
        videoUrl,
        podcastUrl,
        content,
        imageUrl,
        imageDescription,
        likes
      } = post;
      const isActive = true;
      const tags = tagsNames;
      const createdAt = new Date(post.createdAt);
      let userIdFromCosmos;
      const querySpec = {
        query: "SELECT * from c where c.email = @email",
        parameters: [
          {
            name: "@id",
            value: user.email,
          },
        ],
      };
      const { resources } = await userContainer.items.query(querySpec).fetchAll();
      if (resources.length > 0) {
        userIdFromCosmos = resources[0].id;
      } else {
        const newUser: User = {
          name: user.name,
          email: user.email,
          role: Role.AUTHOR,
          image: user.image,
          password: bcrypt.hashSync('password', 5),
          isActive: true,
          createdAt: new Date(user.createdAt),
        };
        const { resource } = await userContainer.items.create(newUser);
        userIdFromCosmos = resource.id;
      }

      const postToCosmos: Post = {
        title,
        slug,
        category,
        subCategory,
        readingTime,
        description,
        videoUrl,
        podcastUrl,
        content,
        imageUrl,
        imageDescription,
        likes,
        userId: userIdFromCosmos,
        attachments: [],
        tags,
        isActive,
        createdAt,
      };
      await postsContainer.items.create(postToCosmos);
      return postToCosmos;
    } catch (error) {
      console.log('error with ', post.id)
    }
  }));
  writeFile('items.json', JSON.stringify(items, null, 2));
}

async function changeDate() {
  const ids = restored.map(r => r.id);
  const newPosts = [];
  for (const id of ids) {
    const querySpec = {
      query: "SELECT * from c where c.id = @id",
      parameters: [
        {
          name: "@id",
          value: id,
        },
      ],
    };
    const { resources } = await postsContainer.items.query(querySpec).fetchAll();
    const post = resources[0];
    const createdAt = new Date(post.createdAt);
    createdAt.setHours(7);
    createdAt.setMinutes(0);
    createdAt.setSeconds(0);
    createdAt.setDate(5);
    createdAt.setMonth(2);
    const newPost = {
      ...post,
      createdAt
    }
    newPosts.push(newPost);
    postsContainer.item(id).replace(newPost);
  }
  writeFile('newPosts.json', JSON.stringify(newPosts, null, 2));
}

changeDate();

// restore();