
import { uuid as uuidv4, ServiceProvider, ChatHistory, ActionProps, Action, LLMUtil, LLMProviderBase, Command, environment, CoreDataChatHistory } from "@enconvo/api";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { openai_meta_prompt as prompt } from "./prompts.ts";


const chatHistory = new CoreDataChatHistory();

export default async function main(req: Request) {
    const { options } = await req.json();
    const { text, context, reset, clean_result } = options;

    let inputMessage = text || context;


    if (!inputMessage) {
        throw new Error("No text to be processed")
    }

    const requestId = uuidv4()

    reset && chatHistory.reset();
    // const historyMessages = await chatHistory.getMessages()
    let messages: BaseMessage[] = [];
    // const hasMessages = historyMessages.length > 0

    // if (hasMessages) {
    //     messages = [
    //         new SystemMessage(`Your are a bot named ${environment.commandTitle}, your prompt is "${promptMessage}",please respond based on the user's latest input. `),
    //         ...historyMessages,
    //         new HumanMessage(message)
    //     ]

    // } else {

    const userMessage = `Task, Goal, or Current Prompt:\n${inputMessage}`;


    messages = [
        new SystemMessage(prompt),
        new HumanMessage(userMessage),
    ];
    // }

    let chat: LLMProviderBase = ServiceProvider.load(options.llm)
    const stream = (await chat.call({ messages })).stream!
    const result = await LLMUtil.invokeLLMStream(stream, options)


    await ChatHistory.saveChatMessages({
        input: inputMessage,
        output: result,
        llmOptions: options.llm,
        requestId
    });

    const actions: ActionProps[] = [
        Action.Paste({ content: result }),
        Action.InsertBelow({ content: result }),
        Action.Copy({ content: result })
    ]

    const output = {
        content: result,
        actions: actions
    }

    Command.setDefaultCommandKey(`${environment.extensionName}|${environment.commandName}`).then()

    return output;
}

