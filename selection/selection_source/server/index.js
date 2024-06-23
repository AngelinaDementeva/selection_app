var https = require('https')
var express = require("express")
var fs = require('fs')
var pdfParse = require('pdf-parse');
const { exec } = require('child_process');

httpsOptions = {
    key: fs.readFileSync("private.key"),
    cert: fs.readFileSync("certificate.crt")
}

var app = express(httpsOptions);
var server = https.createServer(httpsOptions, app);
var cors = require('cors')

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

const port = 8000;
io.listen(process.env.PORT || port);
console.log('listening on port ', port);

function formatPhp(phpCode) {
    const escapedPhpCode = phpCode.replace(/"/g, '\\"');

    return escapedPhpCode;
}

let temporaryClientId;

io.on("connection", (socket) => {

    socket.on('createRoom', (params) => { 
        const roomWord = params.roomWord;

        socket.join(roomWord); 

        socket.emit('connectRoom', { data: `You successfully connected (created) room with id: ${roomWord}`, roomWord: roomWord, mode: 'creator' })
    })

    socket.on('connectToRoom', (params) => { 
        const roomWord = params.roomWord;

        socket.join(roomWord); 

        socket.emit('connectRoom', { data: `You successfully joined to room with id: ${roomWord}`, roomWord: roomWord, mode: 'reader' })
    })

    socket.on('changeSelectLanguage', (params) => {
        const roomWord = params.roomWord;

        console.log(roomWord, ' ', params.select)

        socket.to(roomWord).emit('changedSelectLanguage', { select: params.select })
    })

    socket.on('updateCode', (params) => {
        const roomWord = params.roomWord;

        socket.to(roomWord).emit('updateCode', { code: params.code, language: params.language }) 
    })

    socket.on('getData', (params) => {
        const roomWord = params.roomWord;
        temporaryClientId = socket.id;

        const firstClientId = io.sockets.adapter.rooms.get(roomWord).values().next().value;
        if (firstClientId) {
            io.to(firstClientId).emit('serveData');
        }
    })

    socket.on('servedData', (params) => {
        socket.to(temporaryClientId).emit('gotData', { data: params.data })
    })
    
    socket.on('getResults', (params) => {
        console.log(params.keyword)
        pdfParse(params.fileData)
            .then(data => {
                const lines = data.text.split('\n');
                let found = false;
                const keywordLowerCase = params.keyword.toLowerCase(); 
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].toLowerCase(); 
                    if (line.includes(keywordLowerCase)) {
                        found = true;
                        const nextLines = lines.slice(i + 1, i + 6); 
                        const formattedText = nextLines.join('. ');
                        console.log(formattedText);
                        socket.emit('getResults', { keyword: params.keyword, result: formattedText });
                        break;
                    }
                }
                if (!found) {
                    console.log(`Заголовок не найден.`);
                }
            })
            .catch(error => {
                socket.emit('error')
            });
    })

    socket.on('compilePhp', function (params) { 
        const filename = `./php/${Date.now()}.php`;
        const phpCode = params.phpCode

        try {
            fs.writeFile(filename, phpCode, (err) => {
                if (err) { 
                    socket.to(params.roomWord).emit('codeError', { data: err })
                    socket.emit('codeError', { data: err })
                    return 
                }

                exec(`php ${filename}`, (error, stdout, stderr) => {
                    if (error) {
                        socket.to(params.roomWord).emit('codeError', { data: error }) 
                        socket.emit('codeError', { data: error })
                        return
                    }

                    socket.to(params.roomWord).emit('phpResults', ({ result: stdout }))
                    socket.emit('phpResults', ({ result: stdout }))

                    fs.unlink(filename, (err) => {
                        if (err) return console.log('error #321')
                    });
                });
            });
        } catch (e) {
            socket.to(params.roomWord).emit('phpResults', { data: e })
            socket.emit('phpResults', { data: e })
        }
    })

    socket.on('compilePython', function (params) { 
        const filename = `./python/${Date.now()}.py`;
        const pythonCode = params.pythonCode

        try {
            fs.writeFile(filename, pythonCode, (err) => {
                if (err) {
                    socket.to(params.roomWord).emit('codeError', { data: err })
                    socket.emit('codeError', { data: err })
                    return 
                }

                exec(`python3.7 ${filename}`, (error, stdout, stderr) => {
                    if (error) {
                        socket.to(params.roomWord).emit('codeError', { data: error })
                        socket.emit('codeError', { data: error })
                        return
                    }

                    socket.to(params.roomWord).emit('pythonResults', ({ result: stdout }))
                    socket.emit('pythonResults', ({ result: stdout }))

                    fs.unlink(filename, (err) => {
                        if (err) return console.log('error #322')
                    });
                });
            });
        } catch (e) {
            socket.to(params.roomWord).emit('phpResults', { data: e })
            socket.emit('phpResults', { data: e })
        }
    })

    socket.on('compileNode', function (params) { 
        const filename = `./node/${Date.now()}.js`;
        const jsCode = params.jsCode

        try {
            fs.writeFile(filename, jsCode, (err) => {
                if (err) { 
                    socket.to(params.roomWord).emit('codeError', { data: err })
                    socket.emit('codeError', { data: err })
                    return 
                }

                exec(`node ${filename}`, (error, stdout, stderr) => {
                    if (error) {
                        socket.to(params.roomWord).emit('codeError', { data: error })
                        socket.emit('codeError', { data: error })
                        return
                    }

                    socket.to(params.roomWord).emit('nodeResults', ({ result: stdout }))
                    socket.emit('nodeResults', ({ result: stdout }))

                    fs.unlink(filename, (err) => {
                        if (err) return console.log('error #323')
                    });
                });
            });
        } catch (e) {
            socket.to(params.roomWord).emit('nodeResults', { data: e })
            socket.emit('nodeResults', ({ result: stdout }))
        }
    })
})
