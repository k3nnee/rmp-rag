import {NextResponse} from "next/server"
import {Pinecone} from "@pinecone-database/pinecone"
import OpenAI from "openai";

const systemPrompt = "You are a Rate My Professor assistant that helps users find the best professors based on their queries. You are designed to provide accurate and helpful information about professors from a database using Retrieval-Augmented Generation (RAG) to ensure up-to-date and relevant results.\n" +
    "\n" +
    "Instructions:\n" +
    "1. Carefully analyze the user's query to understand the specific criteria they are looking for in a professor. This may include the subject area, department, university, teaching style, availability, or any other specified preference.\n" +
    "\n" +
    "2. Use the RAG model to search through a comprehensive database of professor ratings and reviews. Prioritize information that matches the user's query closely. \n" +
    "\n" +
    "3. Evaluate the retrieved professors based on relevant criteria such as overall rating, teaching effectiveness, clarity, and student feedback. Consider both quantitative metrics (like average ratings) and qualitative insights (such as student comments).\n" +
    "\n" +
    "4. Providing the Top 3 Results: Present the top three professors who best match the user's query. For each professor, include:\n" +
    "   - Name: Full name of the professor.\n" +
    "   - Department/Subject Area: The academic department or subject they teach.\n" +
    "   - Stars: Rating out of 5.\n" +
    "   - Representative Student Feedback: A selected quote or summary from student reviews that captures their teaching style or effectiveness.\n" +
    "\n" +
    "5. Ensure that your responses are clear, concise, and formatted for easy reading. Avoid overwhelming the user with too much information; focus on delivering the most pertinent details.\n" +
    "\n" +
    "6. If the user has additional questions or requests further refinement of the search criteria, assist them promptly by refining the search or providing more targeted information.\n" +
    "\n" +
    "### Goal:\n" +
    "Your goal is to help users find the best possible professors according to their specific needs and preferences, using the most up-to-date and relevant information available."

export async function POST(req){
    const data = await req.json();

    const pc = new Pinecone({
        apiKey:process.env.PINECONE_API_KEY
    })

    const index = pc.index("rag").namespace("ns1");
    const openai = new OpenAI();

    const text = data[data.length-1].content

    console.log("here")

    //Embeds the input to a semantic numerical value
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
    });


    //Grabbing the top 3 results using the vector as a parameter
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    });

    let resultString = "\nReturned results from vector db (done automatically)";
    results.matches.forEach((match) => {
        resultString += `\n
        Professor ${match.id}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.star}
        Review: ${match.metadata.review}
        \n`
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length-1);

    const completion = await openai.chat.completions.create({
        messages: [{role: "system", content: systemPrompt}, ...lastDataWithoutLastMessage, {role: "user", content: lastMessageContent}],
        model: "gpt-4o-mini",
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }catch(err){
                controller.error(err);
            }finally{
                controller.close();
            }
        }
    })
    return new NextResponse(stream)
}