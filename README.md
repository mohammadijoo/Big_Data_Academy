# Big Data Academy

[![Big Data Academy](https://img.shields.io/badge/Big%20Data%20Academy-08111f?style=for-the-badge&logo=databricks&logoColor=white)](https://mohammadijoo.github.io/Big_Data_Academy/)
[![Courses](https://img.shields.io/badge/Courses-44-06b6d4?style=flat-square)](https://mohammadijoo.github.io/Big_Data_Academy/#courses)
[![Learning Stages](https://img.shields.io/badge/Learning%20Stages-12-8b5cf6?style=flat-square)](https://mohammadijoo.github.io/Big_Data_Academy/#roadmap)
[![Available Courses](https://img.shields.io/badge/Available%20Courses-9-059669?style=flat-square)](https://mohammadijoo.github.io/Big_Data_Academy/#courses)

Big Data Academy is a browser-native learning platform for databases, SQL, data engineering, distributed systems, data processing, event streaming, lakehouse architecture, cloud analytics, and data visualization. The academy organizes 44 database and big-data technologies into a prerequisite-aware path that progresses from database fundamentals and relational systems to NoSQL, Hadoop, Spark, Kafka, Flink, orchestration, lakehouse table formats, and managed analytical platforms.

The website is implemented as a static GitHub Pages project. Lessons can be studied online or downloaded and opened locally without a server, database, account, or learning-management platform. The academy currently includes 9 fully available courses spanning 203 chapters and 1,015 published lessons, while all 44 course tracks retain permanent curriculum URLs across the complete roadmap.

## Website

Visit the academy:

https://mohammadijoo.github.io/Big_Data_Academy/

## Learning Path

The curriculum is organized into 12 sequential stages:

1. **Data & SQL Foundations** — SQL and Database Fundamentals, Data Modeling and Database Design
2. **Relational Databases** — SQLite, MySQL, PostgreSQL, MariaDB, Microsoft SQL Server, Oracle Database, Entity Framework Core
3. **NoSQL, Search & Application Data** — NoSQL and Distributed Database Fundamentals, MongoDB, Redis, Apache Cassandra, Neo4j, Elasticsearch and OpenSearch, Firebase and Cloud Firestore
4. **Warehousing & Analytical Databases** — Data Warehousing and Dimensional Modeling, DuckDB, ClickHouse
5. **Data Formats, Storage & Distributed Systems** — CSV, JSON, Avro, Parquet and ORC; Object Storage, S3 Concepts and MinIO; Distributed Systems Fundamentals
6. **Hadoop Ecosystem** — Apache Hadoop, Apache ZooKeeper, Apache Hive, Apache HBase, Apache Pig
7. **Distributed Compute & Federated SQL** — Apache Spark, Trino
8. **Event Streaming & Real-Time Processing** — Apache Kafka, Kafka Connect and Schema Management, Apache Flink, Apache Storm, Apache Beam
9. **Integration, CDC & Orchestration** — Debezium, Apache NiFi, Apache Airflow, dbt Core
10. **Lakehouse Table Formats** — Apache Iceberg, Delta Lake, Apache Hudi
11. **Cloud & Managed Data Platforms** — Google BigQuery, Databricks Free Edition
12. **Exploration & Visualization** — Apache Superset

## Current Course Status

### Available

The academy currently has **9 fully available courses with 203 chapters and 1,015 published lessons**:

- **[SQL and Database Fundamentals](https://mohammadijoo.github.io/Big_Data_Academy/courses/sql-database-fundamentals/)** — 18 chapters · 90 lessons published
- **[Data Modeling and Database Design](https://mohammadijoo.github.io/Big_Data_Academy/courses/data-modeling-design/)** — 18 chapters · 90 lessons published
- **[SQLite](https://mohammadijoo.github.io/Big_Data_Academy/courses/sqlite/)** — 20 chapters · 100 lessons published
- **[MySQL](https://mohammadijoo.github.io/Big_Data_Academy/courses/mysql/)** — 22 chapters · 110 lessons published
- **[PostgreSQL](https://mohammadijoo.github.io/Big_Data_Academy/courses/postgresql/)** — 24 chapters · 120 lessons published
- **[MariaDB](https://mohammadijoo.github.io/Big_Data_Academy/courses/mariadb/)** — 22 chapters · 110 lessons published
- **[Microsoft SQL Server](https://mohammadijoo.github.io/Big_Data_Academy/courses/sql-server/)** — 25 chapters · 125 lessons published
- **[Oracle Database](https://mohammadijoo.github.io/Big_Data_Academy/courses/oracle-database/)** — 29 chapters · 145 lessons published
- **[Entity Framework Core](https://mohammadijoo.github.io/Big_Data_Academy/courses/entity-framework-core/)** — 25 chapters · 125 lessons published

These published courses cover the academy's full first two learning stages: data/SQL foundations and relational databases. They use stable curriculum paths and the shared academy lesson experience, including responsive navigation, curriculum search, generated on-page tables of contents, reading progress, code-copy controls, MathJax support, data visualizations, previous/next navigation, references, and support sections.

### Planned

The remaining **35 courses** are displayed in their correct learning stages with permanent curriculum landing pages and planned lesson paths. They will be activated as their full lesson content is completed.

## Platform Features

- Modern responsive interface for desktop, tablet, and mobile devices
- Light and dark themes with persistent user preference
- Searchable and filterable 44-course catalogue
- Sequential learning path with clear categories and prerequisites
- Dedicated curriculum pages and complete lesson sets for the 9 available courses, with permanent curriculum landing pages for all remaining planned courses
- Responsive lesson sidebar with curriculum search
- Generated table of contents and reading-progress indicator
- Custom theme-aware code windows with line numbers and copy controls
- MathJax support for mathematical notation
- Animated data-topology and distributed-system visualizations
- Previous and next lesson navigation
- Donation section and author social links
- Custom 404 page, favicon, web manifest, sitemap, robots file, and GitHub Pages configuration
- Static architecture with no backend, database, build system, or runtime dependency

## Repository Structure

```text
Big_Data_Academy/
├── index.html
├── 404.html
├── LICENSE
├── README.md
├── .nojekyll
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
├── site.config.json
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── data/
│   │   └── courses.json
│   ├── icons/
│   │   └── favicon.svg
│   └── js/
│       ├── catalogue.js
│       ├── course.js
│       ├── data-scenes.js
│       ├── lesson.js
│       └── main.js
├── courses/
│   ├── sql-database-fundamentals/
│   │   ├── index.html
│   │   ├── curriculum.json
│   │   └── Chapter01 ... Chapter18/
│   ├── data-modeling-design/
│   │   ├── index.html
│   │   ├── curriculum.json
│   │   └── Chapter01 ... Chapter18/
│   ├── sqlite/
│   │   └── Chapter01 ... Chapter20/
│   ├── mysql/
│   │   └── Chapter01 ... Chapter22/
│   ├── postgresql/
│   │   └── Chapter01 ... Chapter24/
│   ├── mariadb/
│   │   └── Chapter01 ... Chapter22/
│   ├── sql-server/
│   │   └── Chapter01 ... Chapter25/
│   ├── oracle-database/
│   │   └── Chapter01 ... Chapter29/
│   ├── entity-framework-core/
│   │   └── Chapter01 ... Chapter25/
│   └── ... 35 additional planned course directories
├── templates/
│   └── lesson-template.html
└── tools/
    └── validate_site.py
```

## Technologies

The academy is built with semantic HTML5, modern CSS, and vanilla JavaScript. It uses custom theme-aware code presentation, MathJax for mathematical notation, responsive data visualizations, browser storage for theme preferences, and JSON-driven course and curriculum data.

The site is designed to run directly on GitHub Pages and to remain usable as a local offline copy.

## Educational Scope

The curriculum prioritizes technologies that can be learned through open-source editions, community editions, local installations, developer sandboxes, permanent free editions, or practical free tiers. Commercial and enterprise capabilities may be explained for completeness, but the hands-on lessons are designed so learners do not need to purchase a paid license.

Apache Pig and Apache Storm are retained as historical or specialized technologies within their appropriate learning stages. Modern alternatives are given greater emphasis throughout the main learning path.

## Author

**Abolfazl Mohammadijoo**

- Website: https://mohammadijoo.ir/
- GitHub: https://github.com/mohammadijoo
- LinkedIn: https://www.linkedin.com/in/abolfazlmohammadijoo
- X: https://x.com/mohammadijoo

## License

This repository uses a dual non-commercial licensing structure:

- Educational text, diagrams, and course content are licensed under **CC BY-NC-SA 4.0**.
- Original website source code and design implementation are licensed under **PolyForm Noncommercial 1.0.0**, unless a file states otherwise.

Third-party product names and trademarks belong to their respective owners. Commercial use requires separate written permission from the repository owner.

See [LICENSE](LICENSE) for the complete repository licensing notice and commercial-use requirements.
