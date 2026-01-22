SELECT id, appointment_type_id, question_text, answer_type, options, is_mandatory, sort_order 
FROM questions 
WHERE answer_type IN ('radio', 'checkbox')
LIMIT 10;
