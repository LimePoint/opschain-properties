# frozen_string_literal: true

require 'shellwords'
require 'rugged'
require 'date'
require 'fileutils'

MASTER_BRANCH = 'main'

BASE_REPO_PATH = 'https://github.com/LimePoint/'
TP_LICENCE_FILE = 'THIRD-PARTY-SOFTWARE'
RELEASE_VERSION_FILE = 'tmp/opschain-properties/RELEASE-VERSION'
RELEASE_VERSION = 

ENV['GIT_AUTHOR_NAME']  = ENV['GIT_COMMITTER_NAME']  = 'OpsChain'
ENV['GIT_AUTHOR_EMAIL'] = ENV['GIT_COMMITTER_EMAIL'] = 'opschain@limepoint.com'

def clone_repo(repo, branch = MASTER_BRANCH)
  repo = repo.shellescape
  sh "rm -rf #{repo}"
  sh "git clone #{BASE_REPO_PATH}#{repo}.git #{repo}"

  Dir.chdir(repo) do
    sh 'git', 'checkout', branch
    yield
  end
end

def release_tag
  release_version
end

def release_version
  return "v1"
end

def date_tag
  Date.today.iso8601
end

def tag_and_push(tag)
  tag = tag.shellescape
  sh "git tag #{tag} --force"
  sh "git push origin #{MASTER_BRANCH} --force"
  sh "git push origin #{tag} --force"
end

def tag_and_process_repos(repos)
  FileUtils.mkdir_p 'tmp'
  Dir.chdir 'tmp' do
    repos.each do |repo|
      clone_repo(repo) do
        yield if block_given?
        tag_and_push(release_tag)
      end
    end
  end
end

PUBLIC_REPOS = %w[
  opschain-github
].freeze

def private_repo_name(repo)
  "#{repo}-private"
end

def tag_exists?(tag)
  Rugged::Repository.new('.').rev_parse(tag)
  true
rescue Rugged::ReferenceError
  false
end

def squash_and_publish_repo(public_repo, tag)
  FileUtils.mkdir_p 'tmp'
  Dir.chdir 'tmp' do
    clone_repo(public_repo) do
      sh "git remote add private-repo #{BASE_REPO_PATH}#{private_repo_name(public_repo)}.git"
      sh 'git fetch --force --tags private-repo'
      if tag_exists?(tag)
        sh 'git rm -rf . || true'
        sh "git checkout --force #{tag} -- ."
        sh 'git add --force .'
        sh "git diff --cached --quiet || git commit -m 'OpsChain GitHub Plugin Release - #{tag}.'"
        tag_and_push(tag)
      else
        warn "Tag #{tag} not found in repository #{private_repo_name(public_repo)}."
      end
    end
  end
end

def create_release_version_file
  Rake::Task[RELEASE_VERSION_FILE].invoke

  sh "git add #{release_version_file.basename}"
  sh "git diff --cached --quiet || git commit -m 'Updating release version'"
end

file RELEASE_VERSION_FILE do
  File.write(release_version_file, release_tag)
end

namespace :public_git_repos do
  desc 'Publish squashed public repos'
  task :publish_squashed_repos, [:tag] do |_t, args|
    args.with_defaults(tag: release_tag)
    tag = args[:tag].shellescape
    PUBLIC_REPOS.each { |public_repo| squash_and_publish_repo(public_repo, tag) }
  end
end

namespace :private_git_repos do
  desc 'Tag the private repos with a tag matching matching the relevant release'
  task :tag_latest do
    private_repos = %w[github-action-opschain-properties-private]
    tag_and_process_repos(private_repos)
  end
  desc 'Get release version'
  task :release_version do
    puts "Current Release: #{release_version}"
  end
end