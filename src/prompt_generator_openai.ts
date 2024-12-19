import { Action, Command, environment, BaseChatMessage, SystemMessage, UserMessage, RequestOptions, LLMProvider, ResponseAction, EnconvoResponse } from "@enconvo/api";
import { openai_meta_prompt as prompt } from "./prompts.ts";

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: RequestOptions = await req.json();
    const { input_text, selection_text, context } = options;

    let inputMessage = input_text || selection_text || context;


    if (!inputMessage) {
        throw new Error("No text to be processed")
    }

    let messages: BaseChatMessage[] = [];

    const userMessage = `Task, Goal, or Current Prompt:\n${inputMessage}`;

    messages = [
        new SystemMessage(prompt),
        new UserMessage(userMessage),
    ];
    const llmProvider = await LLMProvider.fromEnv()
    const resultMessage = await llmProvider.stream({ messages, autoHandle: true })

    const result = resultMessage.text()


    const actions: ResponseAction[] = [
        Action.Paste({ content: result }),
        Action.InsertBelow({ content: result }),
        Action.Copy({ content: result })
    ]

    Command.setDefaultCommandKey(`${environment.extensionName}|${environment.commandName}`).then()

    return {
        type: "text",
        content: result,
        actions: actions
    };
}

