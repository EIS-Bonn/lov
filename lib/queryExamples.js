module.exports = [
  {
    title:"Vocabularies contained in BigDataOcean and their prefix",
    query:"PREFIX vann:<http://purl.org/vocab/vann/>\nPREFIX voaf:<http://purl.org/vocommons/voaf#>\n\n### Vocabularies contained in BigDataOcean and their prefix\nSELECT DISTINCT ?vocabPrefix ?vocabURI {\n		?vocabURI a voaf:Vocabulary.\n		?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.\n	} ORDER BY ?vocabPrefix"
  },
  {
    title:"Vocabularies using a language other than English, sorted by language code",
    query:"PREFIX vann:<http://purl.org/vocab/vann/>\nPREFIX voaf:<http://purl.org/vocommons/voaf#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\n### Vocabularies using a language other than English, sorted by language code\nSELECT DISTINCT ?code ?title ?vocab {\n		?vocab a voaf:Vocabulary.\n		?vocab dcterms:title ?title.\n		?vocab dcterms:language ?eng.\n		?vocab dcterms:language ?lang.\n		FILTER ( ?lang != ?eng )\n		FILTER ( CONTAINS (STR(?eng), 'eng') )\n		BIND(REPLACE(STR(?lang), 'http://www.lexvo.org/page/iso639-3/', '') AS ?code)\n	}ORDER BY ?code ?title"
  },
  {
    title:"Vocabularies modified since 2014-01-01, sorted by modification date",
    query:"PREFIX voaf:<http://purl.org/vocommons/voaf#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\n### Vocabularies modified since 2014-01-01, sorted by modification date\nSELECT DISTINCT ?date ?title ?vocab {\n		?vocab a voaf:Vocabulary.\n		?vocab dcterms:title ?title.\n		?vocab dcterms:modified ?modified.\n		FILTER ( STR(?modified) > '2014')\n		BIND (STR(?modified) as ?date )\n	} ORDER BY DESC(?date) ?title"
  }
]