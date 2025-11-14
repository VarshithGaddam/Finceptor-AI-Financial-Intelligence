import React, { useEffect } from 'react';

const FilingDisplay = ({ filingData }) => {
  useEffect(() => {
    console.log('FilingDisplay received props:', filingData);
  }, [filingData]);

  if (!filingData) {
    return <div>No filing data provided.</div>;
  }

  const { structured, year, embedData } = filingData;

  if (!structured) {
    return <div>No structured data available.</div>;
  }

  const { company, ticker, form, table_of_contents } = structured;

  // Extract sections (e.g., item_1, item_1a, ...)
  const sections = Object.keys(structured)
    .filter(key => key.startsWith('item_'))
    .sort();

  return (
    <div className="filing-display p-4">
      <h1 className="text-2xl font-bold mb-4">
        {company || 'Unknown Company'} ({ticker || 'N/A'}) - {form || 'N/A'} {year || 'N/A'}
      </h1>

      {table_of_contents && table_of_contents.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold mb-2">Table of Contents</h2>
          <ul className="list-disc pl-5 mb-4">
            {table_of_contents.map((toc, index) => (
              <li key={index}>
                {toc.item.replace('item_', 'Item ')} - {toc.title}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No table of contents available.</p>
      )}

      {sections.length > 0 ? (
        sections.map(section => (
          <div key={section} className="mb-6">
            <h3 className="text-lg font-semibold">
              {section.replace('item_', 'Item ').toUpperCase()}
            </h3>
            <p className="text-gray-700">
              {structured[section]?.text || 'No content available for this section.'}
            </p>
          </div>
        ))
      ) : (
        <p>No sections available to display.</p>
      )}

      {embedData && (
        <div className="mt-4 text-sm text-gray-500">
          <p>Embeddings Stored: {embedData.upsertedCount} vectors</p>
          <p>Chunks Skipped: {embedData.skippedCount}</p>
        </div>
      )}
    </div>
  );
};

export default FilingDisplay;