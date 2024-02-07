
import { Post } from 'src/posts/entities/post.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

require('dotenv').config();

export const dbdatasource: DataSourceOptions = {
    type: 'postgres',
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT),
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    entities: [User, Tag, Post],
    synchronize: true,
    migrations: ['dist/db/migrations/*.js' as string],
}

const dataSource = new DataSource(dbdatasource);
export default dataSource;