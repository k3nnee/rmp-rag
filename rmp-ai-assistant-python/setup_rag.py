# from dotenv import load_dotenv
# from pinecone import Pinecone, ServerlessSpec
# # Allows us to access files
# import os
# import json
# from openai import OpenAI
#
# load_dotenv()
#
# pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# # # An index allows us to store and query vectors
# # # Each vector will have 1536 dimensions
# # # Cosine metric measures the cosine similarity between vectors
# # # Spec defines the specification for the index deployment
# pc.create_index(
#     name="rag", dimension=1536, metric="cosine", spec=ServerlessSpec(cloud="aws", region="us-east-1")
# )
#
# data = json.load(open("./../reviews.json"))
#
# process_data = []
# client = OpenAI()
#
# for review in data["reviews"]:
#     response = client.embeddings.create(
#         input=review["review"],
#         model="text-embedding-3-small"
#     )
#     embedding = response.data[0].embedding
#     # This is the format for the data that will be stored in the vector
#     process_data.append({
#         "values": embedding,
#         "id": review["professor"],
#         "metadata": {
#             "review": review["review"],
#             "subject": review["subject"],
#             "star": review["star"]
#         }
#     })
#
# # Insert the processed data into db called rag. The vector is named ns1 within rag.
# index = pc.Index("rag")
# # index.upsert(vectors=process_data, namespace="ns1")
#
# print(index.describe_index_stats())
#
