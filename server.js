const { program } = require('commander');
const express = require("express");
const app = express();
const fs = require('fs');
const fsSync = require('fs')
const path = require('path');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const multer = require("multer");



program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-c, --cache <cache>', 'Шлях до кешу')
    .parse(process.argv);

const options = program.opts();
const cachePath = path.resolve(options.cache);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());


const file = fsSync.readFileSync('./openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



app.get('/notes/:name', (req, res) => {
    const notePath = path.join(cachePath, `${req.params.name}.txt`);
    if (fs.existsSync(notePath)) {
        const noteContent = fs.readFileSync(notePath, 'utf-8');
        res.send(noteContent);
    } else {
        res.status(404).send('Not found');
    }
});


app.put('/notes/:name', (req, res) => {
    const notePath = path.join(cachePath, `${req.params.name}.txt`);
    if (fs.existsSync(notePath)) {
        fs.writeFileSync(notePath, req.body.text || '', 'utf-8');
        res.send('Note updated');
    } else {
        res.status(404).send('Not found');
    }
});

app.delete('/notes/:name', (req, res) => {
    const notePath = path.join(cachePath, `${req.params.name}.txt`);
    if (fs.existsSync(notePath)) {
        fs.unlinkSync(notePath);
        res.send('Note deleted');
    } else {
        res.status(404).send('Not found');
    }
});


app.get('/notes', (req, res) => {
    const files = fs.readdirSync(cachePath);
    const notesList = files
        .filter(file => file.endsWith('.txt'))
        .map(file => {
            const name = path.basename(file, '.txt');
            const text = fs.readFileSync(path.join(cachePath, file), 'utf-8');
            return { name, text };
        });
    res.status(200).json(notesList);
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;
    if (!note_name || !note) {
        return res.status(400).send('Both note name and text are required');
    }

    const notePath = path.join(cachePath, `${note_name}.txt`);
    if (fs.existsSync(notePath)) {
        res.status(400).send('Note already exists');
    } else {
        fs.writeFileSync(notePath, note, 'utf-8');
        res.status(201).send('Note created');
    }
});
app.get('/UploadForm.html', (req, res) => {
    const htmlForm = `
        <form action="/write" method="post">
            <input type="text" name="note_name" placeholder="Note Name" required><br> 
            <textarea name="note" placeholder="Note Text" required></textarea><br>
            <br>
            
            <button type="submit">Upload Note</button>
        </form>
    `;
    res.status(200).send(htmlForm);
});


const server = http.createServer(app);

server.listen(options.port, options.host, (error) => {
    if (error) return console.log(`Error: ${error}`);
    console.log(`Server is listening on http://${options.host}:${options.port}`);
});
