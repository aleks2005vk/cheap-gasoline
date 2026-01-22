from fastapi import FastAPI

app = FastAPI()

items = []

@app.get("/")
async def read_root():
		return {"message": "Welcome to the FaFa API!"}

@app.post("/items/")
def create_item(name: str):
	items.append(name)
	return items