export const ptValidationMessages: any = { // Brazilian Portuguese error messages
  required: 'Este campo é obrigatório.',
  minLength: 'É preciso no mínimo {{minimumLength}} caracteres ou mais (tamanho atual: {{currentLength}})',
  maxLength: 'É preciso no máximo  {{maximumLength}} caracteres ou menos (tamanho atual: {{currentLength}})',
  pattern: 'Tem que ajustar ao formato: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Tem que ser uma data, por exemplo "2000-12-31"';
      case 'time':
        return 'Tem que ser horário, por exemplo "16:20" ou "03:14:15.9265"';
      case 'date-time':
        return 'Tem que ser data e hora, por exemplo "2000-03-14T01:59" ou "2000-03-14T01:59:26.535Z"';
      case 'email':
        return 'Tem que ser um email, por exemplo "fulano@exemplo.com.br"';
      case 'hostname':
        return 'Tem que ser uma nome de domínio, por exemplo "exemplo.com.br"';
      case 'ipv4':
        return 'Tem que ser um endereço IPv4, por exemplo "127.0.0.1"';
      case 'ipv6':
        return 'Tem que ser um endereço IPv6, por exemplo "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return 'Tem que ser uma URL, por exemplo "http://www.exemplo.com.br/pagina.html"';
      case 'uuid':
        return 'Tem que ser um uuid, por exemplo "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return 'Tem que ser uma cor, por exemplo "#FFFFFF" ou "rgb(255, 255, 255)"';
      case 'json-pointer':
        return 'Tem que ser um JSON Pointer, por exemplo "/referencia/para/algo"';
      case 'relative-json-pointer':
        return 'Tem que ser um JSON Pointer relativo, por exemplo "2/referencia/para/algo"';
      case 'regex':
        return 'Tem que ser uma expressão regular, por exemplo "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return 'Tem que ser no formato: ' + error.requiredFormat;
    }
  },
  minimum: 'Tem que ser {{minimumValue}} ou mais',
  exclusiveMinimum: 'Tem que ser mais que {{exclusiveMinimumValue}}',
  maximum: 'Tem que ser {{maximumValue}} ou menos',
  exclusiveMaximum: 'Tem que ser menor que {{exclusiveMaximumValue}}',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Tem que ter ${decimals} ou menos casas decimais.`;
    } else {
      return `Tem que ser um múltiplo de ${error.multipleOfValue}.`;
    }
  },
  minProperties: 'Deve ter {{minimumProperties}} ou mais itens (itens até o momento: {{currentProperties}})',
  maxProperties: 'Deve ter {{maximumProperties}} ou menos intens (itens até o momento: {{currentProperties}})',
  minItems: 'Deve ter {{minimumItems}} ou mais itens (itens até o momento: {{currentItems}})',
  maxItems: 'Deve ter {{maximumItems}} ou menos itens (itens até o momento: {{currentItems}})',
  uniqueItems: 'Todos os itens devem ser únicos',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
