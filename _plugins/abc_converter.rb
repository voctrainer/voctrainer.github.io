module Jekyll
  class AbcPage < Page
    def initialize(site, base, dir, name, content, front_matter)
      @site = site
      @base = base
      @dir = dir
      @name = name

      self.process(@name)
      self.data = front_matter
      self.content = content
    end
  end

  class AbcGenerator < Generator
    safe true
    priority :low

    def generate(site)
      abc_files = site.static_files.select { |file| file.extname == '.abc' }
      
      abc_files.each do |abc_file|
        # Читаем содержимое ABC файла
        abc_content = File.read(File.join(site.source, abc_file.path))
        
        # Извлекаем информацию из первой партитуры
        first_tune_match = abc_content.match(/X:\s*\d+\s*(.*?)(?=X:\s*\d+|\z)/m)
        first_tune = first_tune_match ? first_tune_match[1] : abc_content
        
        title_match = first_tune.match(/T:\s*([^\n]+)/)
        composer_match = first_tune.match(/C:\s*([^\n]+)/)
        
        title = title_match ? title_match[1].strip : File.basename(abc_file.name, '.abc')
        composer = composer_match ? composer_match[1].strip : ''
        
        # Создаем front matter
        front_matter = {
          'layout' => 'abc_partiture',
          'title' => title,
          'composer' => composer,
          'nav' => true,
          'abc_source' => abc_content
        }
        
        # Создаем HTML имя файла
        html_name = File.basename(abc_file.name, '.abc') + '.html'
        
        # Создаем страницу
        page = AbcPage.new(site, site.source, abc_file.dir, html_name, '', front_matter)
        site.pages << page
      end
    end
  end
end
