import pandas as pd

# Load the data
df = pd.read_csv('/Users/tanjiunkoon/Documents/GitHub/FIT3179-A2/data/Updated_Unemployment_Rate_Data.csv')

# Pivot the data
df_wide = df.pivot(index='state', columns='date', values='u_rate')

# Reset index to turn 'state' back into a column
df_wide.reset_index(inplace=True)

# Rename columns to prepend 'y' to years (since field names can't start with numbers in Vega-Lite)
df_wide.columns = ['state'] + ['y' + str(int(col)) for col in df_wide.columns[1:]]

# Save the wide-format data
df_wide.to_csv('Unemployment_Rate_Wide.csv', index=False)
