import express from "express"
import path  from "path"
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import  cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
const app = express() 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

const corsOptions = {
  origin: '*', // dominio permitido
};
  
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname,'public')))

export default app