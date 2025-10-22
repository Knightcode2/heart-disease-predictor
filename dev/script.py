import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('data/heart_disease_dataset-final.csv')

# Display basic information about the dataset
print("Dataset shape:", df.shape)
print("\nFirst few rows:")
print(df.head())

print("\nColumn information:")
print(df.info())

print("\nTarget variable distribution:")
print(df['Heart Disease'].value_counts())

print("\nFeature summary:")
for col in df.columns:
    if col != 'Heart Disease':
        if df[col].dtype == 'object':
            print(f"\n{col}: {df[col].unique()}")
        else:
            print(f"\n{col}: {df[col].min()} - {df[col].max()}")
