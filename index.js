const express = require('express');
const axios = require('axios');
const cors = require('cors');
const stream = require('stream');
const { promisify } = require('util');

const app = express();
app.use(cors());
app.use(express.json()); // 解析JSON请求体
// 根目录路由，发送一个HTML页面，其中包含用于显示验证码的图像
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/udio', (req, res) => {
    res.sendFile(__dirname + '/udio.html');
});
app.get('/logo.jpg', (req, res) => {
    res.sendFile(__dirname + '/logo.jpg');
});
// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 下载文件的路由
app.post('/download', async (req, res) => {
    const { id, shareLink, format } = req.body;
    const sunoId = id || shareLink.match(/\/song\/(.*?)(\/|$)/)[1];
    const fileUrl = `https://cdn1.suno.ai/${sunoId}.${format}`;

    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // 设置响应头以下载文件
        res.setHeader('Content-Disposition', `attachment; filename=${sunoId}.${format}`);
        res.setHeader('Content-Type', response.headers['content-type']);

        const pipeline = promisify(stream.pipeline);
        await pipeline(response.data, res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error downloading file');
    }
});
// 下载文件的路由
app.post('/downloadUdio', async (req, res) => {
    const { shareLink, format } = req.body;
    try {
        const response = await axios.get(shareLink);
        const htmlContent = response.data;
        const match = htmlContent.match(/<meta name="twitter:player" content="(.*?)"/i);
        const mediaUrl = match ? match[1] : null;
        if (mediaUrl) {
            // 这里可以继续处理mediaUrl，比如直接下载或返回给客户端
            console.log(mediaUrl); // 输出或处理URL
            // res.send({ mediaUrl }); // 作为示例，直接返回URL
            //https://www.udio.com/embed/711c7c5a-5724-427d-a39f-8eabe1f5a5f1
            //https://www.udio.com/api/songs?songIds=711c7c5a-5724-427d-a39f-8eabe1f5a5f1
            const udioId = mediaUrl.match(/\/embed\/([a-z0-9-]+)/i)[1];
            const infoUrl = `https://www.udio.com/api/songs?songIds=${udioId}`;
            const infoResponse = await axios.get(infoUrl);
            const infoContent = infoResponse.data;
            // console.log(infoContent);
            const songPath = infoContent.songs[0].song_path;
            const videoPath = infoContent.songs[0].video_path;

            // console.log('Song Path:', songPath);
            // console.log('Video Path:', videoPath);
            if("mp3"===format){
                // 下载视频文件
                const response = await axios({
                            url: songPath,
                            method: 'GET',
                            responseType: 'stream'
                        });
                // 设置响应头以下载文件
                res.setHeader('Content-Disposition', `attachment; filename=${udioId}.${format}`);
                res.setHeader('Content-Type', response.headers['content-type']);
        
                const pipeline = promisify(stream.pipeline);
                await pipeline(response.data, res);
            } else if("mp4"===format){
                // 下载视频文件
                const response = await axios({
                            url: videoPath,
                            method: 'GET',  
                            responseType: 'stream'                        
                        });
                // 设置响应头以下载文件
                res.setHeader('Content-Disposition', `attachment; filename=${udioId}.${format}`);
                res.setHeader('Content-Type', response.headers['content-type']);
        
                const pipeline = promisify(stream.pipeline);
                await pipeline(response.data, res);
            }

        } else {
            res.status(500).send('Error fetching URL');
        }
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Error fetching URL');
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
