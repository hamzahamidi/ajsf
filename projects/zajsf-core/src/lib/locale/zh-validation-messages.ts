export const zhValidationMessages: any = { // Chinese error messages
  required: '必填字段.',
  minLength: '字符长度必须大于或者等于 {{minimumLength}} (当前长度: {{currentLength}})',
  maxLength: '字符长度必须小于或者等于 {{maximumLength}} (当前长度: {{currentLength}})',
  pattern: '必须匹配正则表达式: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return '必须为日期格式, 比如 "2000-12-31"';
      case 'time':
        return '必须为时间格式, 比如 "16:20" 或者 "03:14:15.9265"';
      case 'date-time':
        return '必须为日期时间格式, 比如 "2000-03-14T01:59" 或者 "2000-03-14T01:59:26.535Z"';
      case 'email':
        return '必须为邮箱地址, 比如 "name@example.com"';
      case 'hostname':
        return '必须为主机名, 比如 "example.com"';
      case 'ipv4':
        return '必须为 IPv4 地址, 比如 "127.0.0.1"';
      case 'ipv6':
        return '必须为 IPv6 地址, 比如 "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return '必须为 url, 比如 "http://www.example.com/page.html"';
      case 'uuid':
        return '必须为 uuid, 比如 "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return '必须为颜色值, 比如 "#FFFFFF" 或者 "rgb(255, 255, 255)"';
      case 'json-pointer':
        return '必须为 JSON Pointer, 比如 "/pointer/to/something"';
      case 'relative-json-pointer':
        return '必须为相对的 JSON Pointer, 比如 "2/pointer/to/something"';
      case 'regex':
        return '必须为正则表达式, 比如 "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return '必须为格式正确的 ' + error.requiredFormat;
    }
  },
  minimum: '必须大于或者等于最小值: {{minimumValue}}',
  exclusiveMinimum: '必须大于最小值: {{exclusiveMinimumValue}}',
  maximum: '必须小于或者等于最大值: {{maximumValue}}',
  exclusiveMaximum: '必须小于最大值: {{exclusiveMaximumValue}}',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `必须有 ${decimals} 位或更少的小数位`;
    } else {
      return `必须为 ${error.multipleOfValue} 的倍数`;
    }
  },
  minProperties: '项目数必须大于或者等于 {{minimumProperties}} (当前项目数: {{currentProperties}})',
  maxProperties: '项目数必须小于或者等于 {{maximumProperties}} (当前项目数: {{currentProperties}})',
  minItems: '项目数必须大于或者等于 {{minimumItems}} (当前项目数: {{currentItems}})',
  maxItems: '项目数必须小于或者等于 {{maximumItems}} (当前项目数: {{currentItems}})',
  uniqueItems: '所有项目必须是唯一的',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
