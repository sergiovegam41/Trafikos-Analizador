import {config} from 'dotenv';

config()

export const MONGODB_URI = process.env.MONGODB_URI
export const MONGODB_NAME = process.env.MONGODB_NAME
export const PORT = process.env.PORT
export const PROYECT_NAME = process.env.PROYECT_NAME
export const URI_MSQL = process.env.URI_MSQL

