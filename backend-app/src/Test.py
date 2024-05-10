import random

# Set random values for 'day' (1 to 5) and 'period' (1 to 8) for each instructor's 'periods'
for instructor in data['Instructor']:
    random_day = random.randint(1, 5)
    random_period = random.randint(1, 8)
    instructor['periods'] = [{"day": random_day, "period": random_period}]

# Save the randomly adjusted data back to the file
with open(file_path, 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=2)

file_path
