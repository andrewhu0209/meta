const fs = require('fs');
const languages = require('./config').languages;

const syncQuestions = {};

for(let i=0;i<languages.length;i++){
    const fileList = fs.readdirSync(languages[i].dir);

    fileList.forEach((fileName)=>{
        const id = fileName.split('.')[2];
        syncQuestions[id] = true;
    });
}

const https = require('https');

function getQuestions(){
    return new Promise((resolve)=>{
        https.get("https://leetcode-cn.com/api/problems/all/",{
            headers:{
                Cookie:require('./cookie'),
            },
        },(res)=>{
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { 
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`出现错误: ${e.message}`);
        });
    });
}


getQuestions().then(({stat_status_pairs})=>{

    const unsyncQuestions = stat_status_pairs.filter((item)=>{
        const id = item.stat.question_id;
        const status = item.status;

        if(status === 'ac' && !syncQuestions[id]){
            return true;
        }
        return false;
    }).map(item=>item.stat.question__title_slug);
    if(unsyncQuestions.length){
        fs.writeFile('./TODO.json',JSON.stringify(unsyncQuestions,null,4),'utf8',(err)=>{
            if (err) {
                throw err;
            }
            console.log('文件已被保存');
        })
    }else{
        console.log('问题已全部同步');
    }
});