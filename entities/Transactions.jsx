{
  "name": "Transaction",
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "description": "Transaction amount"
    },
    "type": {
      "type": "string",
      "enum": [
        "income",
        "expense"
      ],
      "description": "Whether this is income or expense"
    },
    "category": {
      "type": "string",
      "enum": [
        "salary",
        "freelance",
        "investment",
        "gift",
        "other_income",
        "food",
        "transport",
        "housing",
        "utilities",
        "entertainment",
        "shopping",
        "health",
        "education",
        "subscriptions",
        "travel",
        "other_expense"
      ],
      "description": "Category of the transaction"
    },
    "description": {
      "type": "string",
      "description": "Description or note"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Date of the transaction"
    }
  },
  "required": [
    "amount",
    "type",
    "category",
    "date"
  ]
}