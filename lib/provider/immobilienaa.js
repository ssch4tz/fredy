const utils = require('../utils');

let appliedBlackList = [];

function normalize(o) {
  const id = o.id.substring(o.id.indexOf('-') + 1, o.id.length);
  const size = o.size || 'N/A m²';
  const price = (o.price || '--- €').replace('Preis auf Anfrage', '--- €');
  const address = o.address || 'No address available';
  const title = o.title || 'No title available';
  const link = `https://immobilien.augsburger-allgemeine.de/immobilien/${id}`;
  const description = o.description;
  const source = o.source || '';
  return Object.assign(o, { id, address, price, size, title, link, description, source });
}

function applyBlacklist(o) {
  const titleNotBlacklisted = !utils.isOneOf(o.title, appliedBlackList);
  const descNotBlacklisted = !utils.isOneOf(o.description, appliedBlackList);
  const sourceNotExternal = !utils.isOneOf(o.source, ['Quelle']);

  return titleNotBlacklisted && descNotBlacklisted && sourceNotExternal;
}

const config = {
  url: null,
  crawlContainer: '.js-serp-item',
  sortByDateParam: 's=most_recently_updated_first',
  crawlFields: {
    id: '@id',
    price: 'div.item__spec.item-spec-price | trim',
    size: 'div.item__spec.item-spec-area | trim',
    title: 'a.js-item-title-link.ci-search-result__link@title',
    address: 'div.item__locality | removeNewline | trim',
    description: 'div.item__main-info-points.clearfix p small | removeNewline | trim',
    source: '.item__source'
  },
  paginate: 'li.page-item.pagination__item a.page-link@href',
  normalize: normalize,
  filter: applyBlacklist,
};

exports.init = (sourceConfig, blacklist) => {
  config.enabled = sourceConfig.enabled;
  config.url = sourceConfig.url;
  appliedBlackList = blacklist || [];
};

exports.metaInformation = {
  name: 'Augsburger Allgemeine Immobilien',
  baseUrl: 'https://immobilien.augsburger-allgemeine.de/',
  id: __filename.slice(__dirname.length + 1, -3),
};

exports.config = config;
