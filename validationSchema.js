import { object, string, number, date,array} from 'yup';

const nameValidatorRule = string().required().nonNullable().min(3);
const ageValidatorRule = number().required().nonNullable().min(0);
const genderValidator = string().required().nonNullable().oneOf(['male','female','other']);

const BookingUserValidationSchema = object(
    {
        name: nameValidatorRule,
        age: ageValidatorRule.max(100),
        gender: genderValidator,
        children:array().of(
          object(
            {
                name:nameValidatorRule,
                age: ageValidatorRule.max(5),
            }
          )
        )
    }
);

export {BookingUserValidationSchema};