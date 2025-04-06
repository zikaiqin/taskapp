# Use the official PHP image with Apache
FROM php:8.4-apache

# Enable mod_rewrite (for .htaccess file support)
RUN a2enmod rewrite

# Install PostgreSQL PDO extension and dependencies
RUN apt-get update && apt-get install -y \
    libmariadb-dev \
    && docker-php-ext-install pdo pdo_mysql

# Copy the project files into the container (including .htaccess)
COPY . /var/www/html/

# Set the working directory to the project folder
WORKDIR /var/www/html

# Ensure Apache is set to allow .htaccess overrides
RUN echo '<Directory /var/www/html>' >> /etc/apache2/apache2.conf && \
    echo '    AllowOverride All' >> /etc/apache2/apache2.conf && \
    echo '</Directory>' >> /etc/apache2/apache2.conf

# Expose port 80 for Apache
EXPOSE 80

# Start Apache in the foreground
CMD ["apache2-foreground"]