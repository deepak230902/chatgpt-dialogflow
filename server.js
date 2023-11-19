const dialogflow = require('@google-cloud/dialogflow');
const { WebhookClient } = require('dialogflow-fulfillment');
const express = require("express");
const { OpenAI } = require('openai');
require('dotenv').config();

const sessionClient = new dialogflow.SessionsClient();


// const textGeneration = async (prompt) => {
//     console.log(prompt);
// const openai = new OpenAI({ key: "" });
//     try {
//         const response = await openai.createCommission({
//             model: 'text-davinci-003',
//             prompt: `Human: ${prompt}\nAI:`,
//             temperature: 0.9,
//             max_tokens: 500,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0.6,
//             stop: ['Human:', 'AI:']
//         });
//         console.log(response);
//         return {
//             status: 1,
//             response: `${response.data.choices[0].text}`
//         };
//     } catch (error) {
//         return {
//             status: 0,
//             response: ''
//         };
//     }
// };
const textGeneration = async (prompt) => {
    const openai = new OpenAI({ key: "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" });

    try {
        const response = await openai.completions.create({
            model: 'text-davinci-003',
            prompt:  prompt,
            temperature: 0.9,
            max_tokens: 500,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: ['Human:', 'AI:']
        });

        //console.log("OpenAI Response:", response.choices[0].text);

        if (response.choices[0].text.length > 0) {
            const generatedText = response.choices[0].text;
            console.log("Generated Text:", generatedText);
            return {
                status: 1,
                response: generatedText
            };
        } else {
            console.log("No valid response from OpenAI");
            return {
                status: 0,
                response: 'No valid response from OpenAI'
            };
        }
    } catch (error) {
        console.error("Error from OpenAI:", error);
        return {
            status: 0,
            response: ''
        };
    }
};


const webApp = express();
const PORT = process.env.PORT || 5000;

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

webApp.get('/', (req, res) => {
    res.sendStatus(200);
    res.send("Status Okay");
});

webApp.post('/dialogflow', async (req, res) => {
    // Corrected the line with the typo
    var id = (req.body.session).substr(43);
    console.log(id);

    const agent = new WebhookClient({
        request: req,
        response: res
    });

    async function fallback() {
        let action = req.body.queryResult.action;
        let queryText = req.body.queryResult.queryText;

        if (action === 'input.unknown') {
            let result = await textGeneration(queryText);
            if (result.status == 1) {
                agent.add(result.response);
            } else {
                agent.add(`Sorry, I am not able to help with that`);
            }
        }
    }

    function hi(agent) {
        console.log(`intent => hi`);
        agent.add('Hi I am  Deepak ,tell me how can I help you');
    }

    let intentMap = new Map();
    
    intentMap.set('Default Welcome Intent', hi);
    intentMap.set('Default Fallback Intent', fallback);
    agent.handleRequest(intentMap);
});

// Corrected the template string
webApp.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT}/`);
});
