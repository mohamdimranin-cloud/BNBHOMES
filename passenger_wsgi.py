from main import app
import os
import uvicorn

import sys

sys.path.insert(0, os.path.dirname(__file__))
application = app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)