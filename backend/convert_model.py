import sys
from unittest.mock import MagicMock

# Patch tensorflow_decision_forests so tensorflowjs doesn't crash on import
sys.modules['tensorflow_decision_forests'] = MagicMock()

import tensorflowjs as tfjs
import os

input_path = os.path.abspath('../temp_ml_repos/repo1/final_model_kaggle_version1/model.json')
output_path = os.path.abspath('ml_models/model.h5')

print(f"Loading tfjs model from: {input_path}")
model = tfjs.converters.load_keras_model(input_path)

print(f"Saving keras model to: {output_path}")
model.save(output_path)
print("Model converted to H5 format successfully!")
