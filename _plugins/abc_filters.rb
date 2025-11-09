module Jekyll
  module AbcFilters
    def match(input, regex)
      match = input.match(/#{regex}/)
      match ? match[1]&.strip : nil
    end
  end
end

Liquid::Template.register_filter(Jekyll::AbcFilters)
