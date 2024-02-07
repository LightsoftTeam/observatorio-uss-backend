import { DataSource } from "typeorm"
import { dbdatasource } from "../data-source-options"
import { usersSeeder } from "./users.seeder"
import { postsSeeder } from "./posts.seeder"
import { tagsSeeder } from "./tags.seeder"

async function generateData() {
    console.log('Generating data')
    const users = await usersSeeder()
    const tags = await tagsSeeder()
    postsSeeder({users, tags})
}

export const AppDataSource = new DataSource(dbdatasource)

AppDataSource
    .initialize()
    .then((dataSource) => {
        dataSource.synchronize(true)
            .then(generateData)
            .then(_ => {
                console.log('Seeders finished')
            })
    })
    .catch((error) => console.log(error))