import { config } from 'dotenv';

config()

export const MONGODB_URI = process.env.MONGODB_URI
export const MONGODB_NAME = process.env.MONGODB_NAME
export const PORT = process.env.PORT
export const PROYECT_NAME = process.env.PROYECT_NAME
export const URI_MSQL = process.env.URI_MSQL
export const URI_MSQL2 = process.env.URI_MSQL2

export const MAIL_USERNAME = process.env.MAIL_USERNAME
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD
export const APP_LARAVEL_URL = process.env.APP_LARAVEL_URL

