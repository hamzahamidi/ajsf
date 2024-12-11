export const esValidationMessages: any = { // Default Spanish error messages
  required: 'Este campo está requerido.',
  minLength: 'Debe tener {{minimumLength}} caracteres o más longitud (longitud actual: {{currentLength}})',
  maxLength: 'Debe tener {{maximumLength}} caracteres o menos longitud (longitud actual: {{currentLength}})',
  pattern: 'Must match pattern: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Debe tener una fecha, ej "2000-12-31"';
      case 'time':
        return 'Debe tener una hora, ej "16:20" o "03:14:15.9265"';
      case 'date-time':
        return 'Debe tener fecha y hora, ej "2000-03-14T01:59" o "2000-03-14T01:59:26.535Z"';
      case 'email':
        return 'No hay dirección de correo electrónico válida, ej "name@example.com"';
      case 'hostname':
        return 'Debe ser un nombre de host válido, ej "example.com"';
      case 'ipv4':
        return 'Debe ser una dirección de IPv4, ej "127.0.0.1"';
      case 'ipv6':
        return 'Debe ser una dirección de IPv6, ej "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      case 'url':
        return 'Debe ser una URL, ej "http://www.example.com/page.html"';
      case 'uuid':
        return 'Debe ser un UUID, ej "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return 'Debe ser un color, ej "#FFFFFF" or "rgb(255, 255, 255)"';
      case 'json-pointer':
        return 'Debe ser un JSON Pointer, ej "/pointer/to/something"';
      case 'relative-json-pointer':
        return 'Debe ser un JSON Pointer relativo, ej "2/pointer/to/something"';
      case 'regex':
        return 'Debe ser una expresión regular, ej "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return 'Debe tener el formato correcto ' + error.requiredFormat;
    }
  },
  minimum: 'Debe ser {{minimumValue}} o más',
  exclusiveMinimum: 'Debe ser superior a {{exclusiveMinimumValue}}',
  maximum: 'Debe ser {{maximumValue}} o menos',
  exclusiveMaximum: 'Debe ser menor que {{exclusiveMaximumValue}}',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Se permite un máximo de ${decimals} decimales`;
    } else {
      return `Debe ser múltiplo de ${error.multipleOfValue}.`;
    }
  },
  minProperties: 'Debe tener {{minimumProperties}} o más elementos (elementos actuales: {{currentProperties}})',
  maxProperties: 'Debe tener {{maximumProperties}} o menos elementos (elementos actuales: {{currentProperties}})',
  minItems: 'Debe tener {{minimumItems}} o más elementos (elementos actuales: {{currentItems}})',
  maxItems: 'Debe tener {{maximumItems}} o menos elementos (elementos actuales: {{currentItems}})',
  uniqueItems: 'Todos los elementos deben ser únicos',
};
