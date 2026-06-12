"""
Entry point for Streamlit Cloud — starts Flask in a background thread.
Set your Streamlit main file to: start.py
"""
import threading
import app as flask_app

def run():
    flask_app.app.run(host=flask_app.HOST, port=flask_app.PORT, use_reloader=False)

t = threading.Thread(target=run, daemon=True)
t.start()

# Keep Streamlit happy with a minimal UI
import streamlit as st
st.title("AgroVision Backend")
st.success(f"Flask server running on port {flask_app.PORT}")
st.info("Use the frontend app to interact with the API.")
