export const deValidationMessages: any = { // Default German error messages
  required: 'Darf nicht leer sein',
  minLength: 'Mindestens {{minimumLength}} Zeichen benötigt (aktuell: {{currentLength}})',
  maxLength: 'Maximal {{maximumLength}} Zeichen erlaubt (aktuell: {{currentLength}})',
  pattern: 'Entspricht nicht diesem regulären Ausdruck: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Muss ein Datum sein, z. B. "2000-12-31"';
      case 'time':
        return 'Muss eine Zeitangabe sein, z. B. "16:20" oder "03:14:15.9265"';
      case 'date-time':
        return 'Muss Datum mit Zeit beinhalten, z. B. "2000-03-14T01:59" oder "2000-03-14T01:59:26.535Z"';
      case 'email':
        return 'Keine gültige E-Mail-Adresse (z. B. "name@example.com")';
      case 'hostname':
        return 'Kein gültiger Hostname (z. B. "example.com")';
      case 'ipv4':
        return 'Keine gültige IPv4-Adresse (z. B. "127.0.0.1")';
      case 'ipv6':
        return 'Keine gültige IPv6-Adresse (z. B. "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0")';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return 'Keine gültige URL (z. B. "http://www.example.com/page.html")';
      case 'uuid':
        return 'Keine gültige UUID (z. B. "12345678-9ABC-DEF0-1234-56789ABCDEF0")';
      case 'color':
        return 'Kein gültiger Farbwert (z. B. "#FFFFFF" oder "rgb(255, 255, 255)")';
      case 'json-pointer':
        return 'Kein gültiger JSON-Pointer (z. B. "/pointer/to/something")';
      case 'relative-json-pointer':
        return 'Kein gültiger relativer JSON-Pointer (z. B. "2/pointer/to/something")';
      case 'regex':
        return 'Kein gültiger regulärer Ausdruck (z. B. "(1-)?\\d{3}-\\d{3}-\\d{4}")';
      default:
        return 'Muss diesem Format entsprechen: ' + error.requiredFormat;
    }
  },
  minimum: 'Muss mindestens {{minimumValue}} sein',
  exclusiveMinimum: 'Muss größer als {{exclusiveMinimumValue}} sein',
  maximum: 'Darf maximal {{maximumValue}} sein',
  exclusiveMaximum: 'Muss kleiner als {{exclusiveMaximumValue}} sein',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Maximal ${decimals} Dezimalstellen erlaubt`;
    } else {
      return `Muss ein Vielfaches von ${error.multipleOfValue} sein`;
    }
  },
  minProperties: 'Mindestens {{minimumProperties}} Attribute erforderlich (aktuell: {{currentProperties}})',
  maxProperties: 'Maximal {{maximumProperties}} Attribute erlaubt (aktuell: {{currentProperties}})',
  minItems: 'Mindestens {{minimumItems}} Werte erforderlich (aktuell: {{currentItems}})',
  maxItems: 'Maximal {{maximumItems}} Werte erlaubt (aktuell: {{currentItems}})',
  uniqueItems: 'Alle Werte müssen eindeutig sein',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
