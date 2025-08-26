from flask import jsonify

def handler(request):
    return jsonify({"message": "Python is working!"})
