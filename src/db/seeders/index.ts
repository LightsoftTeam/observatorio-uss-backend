import { DataSource } from "typeorm"
import { dbdatasource } from "../data-source-options"
import { usersSeeder } from "./users.seeder"

async function generateData() {
    console.log('Generating data')
    await usersSeeder()
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