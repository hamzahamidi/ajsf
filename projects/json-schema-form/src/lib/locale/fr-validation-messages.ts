export const frValidationMessages: any = { // French error messages
  required: 'Est obligatoire.',
  minLength: 'Doit avoir minimum {{minimumLength}} caractères (actuellement: {{currentLength}})',
  maxLength: 'Doit avoir maximum {{maximumLength}} caractères (actuellement: {{currentLength}})',
  pattern: 'Doit respecter: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Doit être une date, tel que "2000-12-31"';
      case 'time':
        return 'Doit être une heure, tel que "16:20" ou "03:14:15.9265"';
      case 'date-time':
        return 'Doit être une date et une heure, tel que "2000-03-14T01:59" ou "2000-03-14T01:59:26.535Z"';
      case 'email':
        return 'Doit être une adresse e-mail, tel que "name@example.com"';
      case 'hostname':
        return 'Doit être un nom de domaine, tel que "example.com"';
      case 'ipv4':
        return 'Doit être une adresse IPv4, tel que "127.0.0.1"';
      case 'ipv6':
        return 'Doit être une adresse IPv6, tel que "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return 'Doit être une URL, tel que "http://www.example.com/page.html"';
      case 'uuid':
        return 'Doit être un UUID, tel que "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return 'Doit être une couleur, tel que "#FFFFFF" or "rgb(255, 255, 255)"';
      case 'json-pointer':
        return 'Doit être un JSON Pointer, tel que "/pointer/to/something"';
      case 'relative-json-pointer':
        return 'Doit être un relative JSON Pointer, tel que "2/pointer/to/something"';
      case 'regex':
        return 'Doit être une expression régulière, tel que "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return 'Doit être avoir le format correct: ' + error.requiredFormat;
    }
  },
  minimum: 'Doit être supérieur à {{minimumValue}}',
  exclusiveMinimum: 'Doit avoir minimum {{exclusiveMinimumValue}} charactères',
  maximum: 'Doit être inférieur à {{maximumValue}}',
  exclusiveMaximum: 'Doit avoir maximum {{exclusiveMaximumValue}} charactères',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Doit comporter ${decimals} ou moins de decimales.`;
    } else {
      return `Doit être un multiple de ${error.multipleOfValue}.`;
    }
  },
  minProperties: 'Doit comporter au minimum {{minimumProperties}} éléments',
  maxProperties: 'Doit comporter au maximum {{maximumProperties}} éléments',
  minItems: 'Doit comporter au minimum {{minimumItems}} éléments',
  maxItems: 'Doit comporter au maximum {{minimumItems}} éléments',
  uniqueItems: 'Tous les éléments doivent être uniques',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
