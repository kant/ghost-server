import Autosuggest from 'react-autosuggest';
import GhostApiClient from 'ghost-api-client';

let api = new GhostApiClient('https://ghost-server.app.render.com/api');

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = (suggestion) => suggestion.url;

// Use your imagination to render suggestions.
const renderSuggestion = (suggestion) => (
  <div>
    <p>
      <b> {suggestion.title}</b>
    </p>
    <small>{suggestion.snippet}</small>
    <small>{suggestion.url}</small>
  </div>
);

class Example extends React.Component {
  constructor() {
    super();

    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      value: '',
      suggestions: [],
    };
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue,
    });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = async ({ value }) => {
    let results = await api.graphqlAsync({
      query: /* GraphQL */ `
        query Search($query: String) {
          search(query: $query) {
            id
            title
            snippet
            slug
            type
            url
            image {
              height
              width
              url
            }
          }
        }
      `,
      variables: { query: value },
    });
    console.log({results});
    this.setState({ suggestions: results.data.search });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Search for a user/team or tool or game/media or playlist',
      value,
      onChange: this.onChange,
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

export default Example;
