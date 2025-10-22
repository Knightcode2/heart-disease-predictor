# Clean the data and prepare it for modeling
import pandas as pd

df = pd.read_csv('data/heart_disease_dataset-final.csv')
df_clean = df.copy()

# Handle missing values in Alcohol Intake
print("Missing values in Alcohol Intake:", df_clean['Alcohol Intake'].isna().sum())

# Fill missing values with 'None' (most common category for no alcohol)
df_clean['Alcohol Intake'] = df_clean['Alcohol Intake'].fillna('None')

print("After filling missing values:")
print(df_clean['Alcohol Intake'].value_counts())

# Display the cleaned dataset info
print("\nCleaned dataset info:")
print(df_clean.isnull().sum())

# Save cleaned dataset
df_clean.to_csv('data/heart_disease_cleaned.csv', index=False)
print("\nCleaned dataset saved as 'data/heart_disease_cleaned.csv'")
